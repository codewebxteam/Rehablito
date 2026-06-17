const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rehablito_db_user:9X40FmOWzc3Cyljh@cluster0.puexja1.mongodb.net/rehablito').then(async () => {
  const User = require('./models/User');
  const Branch = require('./models/Branch');
  
  const managers = await User.find({ role: 'branch_manager' });
  const branches = await Branch.find();
  
  console.log("Managers found:", managers.map(m => {
    const b = branches.find(branch => String(branch._id) === String(m.branchId));
    return { email: m.email, name: m.name, branchName: b ? b.name : 'Unknown' };
  }));
  process.exit(0);
});
