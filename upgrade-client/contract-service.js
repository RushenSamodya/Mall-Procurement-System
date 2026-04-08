const HotPocket = require('hotpocket-js-client');
const bson = require('bson');

class ContractService {
  constructor(servers) {
    this.servers = servers;
    this.userKeyPair = null;
    this.client = null;
    this.isConnectionSucceeded = false;
    this.promiseMap = new Map();
  }

  async init() {
    if (this.userKeyPair == null) {
      this.userKeyPair = await HotPocket.generateKeys();
    }
    if (this.client == null) {
      this.client = await HotPocket.createClient(this.servers, this.userKeyPair, { protocol: HotPocket.protocols.bson });
    }

    this.client.on(HotPocket.events.disconnect, () => {
      console.log('Disconnected');
      this.isConnectionSucceeded = false;
    });

    this.client.on(HotPocket.events.connectionChange, (server, action) => {
      console.log(server + ' ' + action);
    });

    this.client.on(HotPocket.events.contractOutput, (r) => {
      r.outputs.forEach((o) => {
        let output;
        try { output = bson.deserialize(o); } catch (e) { try { output = JSON.parse(o.toString()); } catch (ee) { output = null; } }
        if (!output) return;
        const pId = output.promiseId;
        if (output.error) this.promiseMap.get(pId)?.rejecter(output.error);
        else this.promiseMap.get(pId)?.resolver(output.success ?? output);
        this.promiseMap.delete(pId);
      });
    });

    if (!this.isConnectionSucceeded) {
      if (!(await this.client.connect())) {
        console.log('Connection failed.');
        return false;
      }
      console.log('HotPocket Connected.');
      this.isConnectionSucceeded = true;
    }
    return true;
  }

  submitInputToContract(inp) {
    const promiseId = this._uniqueId();
    const payload = bson.serialize({ promiseId: promiseId, ...inp });

    this.client.submitContractInput(payload).then((input) => {
      input?.submissionStatus.then((s) => {
        if (s.status !== 'accepted') {
          console.log(`Ledger_Rejection: ${s.reason}`);
        }
      });
    });

    return new Promise((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolver: resolve, rejecter: reject });
    });
  }

  async submitReadRequest(inp) {
    const payload = bson.serialize(inp);
    let output = await this.client.submitContractReadRequest(payload);
    try { output = bson.deserialize(output); } catch (e) { try { output = JSON.parse(output.toString()); } catch (ee) { output = null; } }
    if (!output) throw new Error('Invalid response');
    if (output.error) throw output.error;
    return output.success ?? output;
  }

  _uniqueId() {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}

module.exports = ContractService;
