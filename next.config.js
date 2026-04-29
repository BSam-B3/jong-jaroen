const withSerwist = require("@serwist/next").default({
  swSrc: "app/sw.ts", // ไฟล์ต้นฉบับที่เราจะสร้างในสเต็ปถัดไป
  swDest: "public/sw.js", // ไฟล์ที่จะถูกสร้างออกมาให้เบราว์เซอร์ใช้งาน
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // บีสามสามารถใส่การตั้งค่าอื่นๆ ของ Next.js ตรงนี้ได้ในอนาคตค่ะ
};

module.exports = withSerwist(nextConfig);
