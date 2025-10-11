// hash_tool.js
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10); // Dùng cùng độ dài salt như trong Auth Service
  const hash = await bcrypt.hash(password, salt);
  console.log(`Mật khẩu gốc: ${password}`);
  console.log(`Chuỗi Hash là: ${hash}`);
}

// Thay 'matkhaucuanhanvien' bằng mật khẩu bạn muốn dùng
hashPassword('1233456');