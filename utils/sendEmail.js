const cron = require("node-cron");
const User = require("../models/user");
const { getUserNotificatins } = require("../controllers/notificationController");

const getUsers = async () => {
  try {
    const users = await User.find({})

    users.map(single => getUserNotificatins({ req: { params: { id: single._id } } }))
  } catch (e) {
    console.log(e)
  }
}

cron.schedule("0 8,20 * * *", function () {

})