const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rehablito_db_user:9X40FmOWzc3Cyljh@cluster0.puexja1.mongodb.net/rehablito').then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ role: 'super_admin' }).select('+password');
  
  if (!user) {
    console.log("No super_admin found.");
  } else {
    console.log("Admin Email in DB:", `"${user.email}"`);
    console.log("Testing password match...");
    const isMatch = await user.matchPassword('@Rehablito2026');
    console.log("Does @Rehablito2026 match?", isMatch);
  }
  process.exit(0);
});
