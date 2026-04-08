const HotPocket = require('hotpocket-nodejs-contract');
const bson = require('bson');
const Controller = require('./controller');
const DBInitializer = require('./Data.Deploy/initDB');
const SharedService = require('./Services/Common.Services/SharedService');
// comment
const contract = async (ctx) => {
//  console.log('Shopping Mall Procurement contract running.....');
  SharedService.context = ctx;

  if (!ctx.readonly) {
    ctx.unl.onMessage((node, msg) => {
      try {
        const obj = JSON.parse(msg.toString());
        if (obj.type) SharedService.nplEventEmitter.emit(obj.type, node, msg);
      } catch (e) { /* ignore */ }
    });
  }

  try { await DBInitializer.init(); } catch (e) { console.error('DB init failed:', e); }

  const controller = new Controller();

  for (const user of ctx.users.list()) {
    for (const input of user.inputs) {
      const buf = await ctx.users.read(input);
      let message = null;
      try { message = JSON.parse(buf); } catch (e) { try { message = bson.deserialize(buf); } catch (ee) { message = null; } }
      if (!message) { await user.send({ error: { code: 400, message: 'Invalid payload' } }); continue; }
      await controller.handleRequest(user, message, ctx.readonly);
    }
  }
};

const hpc = new HotPocket.Contract();
hpc.init(contract);

// comment 1

// Test comment from everforge
