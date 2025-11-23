const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10); 
  const hash = await bcrypt.hash(password, salt);
  console.log(`Mật khẩu gốc: ${password}`);
  console.log(`Chuỗi Hash là: ${hash}`);
}

hashPassword('123456');