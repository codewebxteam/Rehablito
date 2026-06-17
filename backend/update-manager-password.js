const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rehablito_db_user:9X40FmOWzc3Cyljh@cluster0.puexja1.mongodb.net/rehablito').then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ email: 'rehablitopatna@gmail.com', role: 'branch_manager' });
  
  if (!user) {
    console.log("No branch_manager found.");
  } else {
    console.log("Updating password for", user.email);
    user.password = '123456';
    await user.save();
    console.log("Password successfully updated!");
  }
  process.exit(0);
});
