
let client = null;

function $create (login, user, feed) {
   return client = {
      state: {
         generateDevice: jest.fn()
      },
      account: {
         login: jest.fn().mockResolvedValue(login)
      },
      feed: {
         user () {
            return {
               request: jest.fn().mockResolvedValue(feed)
            };
         },
      },
      user: {
         searchExact: jest.fn().mockResolvedValue(user)
      }
   };
}

function $reset () {
   client = null;
}

function IgApiClient () {
   return client || $create();
}

module.exports = {
   IgApiClient,
   $create,
   $reset,
}
