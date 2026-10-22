const fs = require('fs');

const buf = fs.readFileSync('C:/Users/dell/.gemini/antigravity-ide/brain/86640a2e-8677-4159-95e5-4d1474d9382b/.user_uploaded/media_1792665347670.pdf');
const str = buf.toString('latin1');
const start = str.indexOf('<?xpacket begin');
const end = str.indexOf('<?xpacket end');
if (start !== -1 && end !== -1) {
  const xml = str.slice(start, end);
  console.log('Qatar matches:', xml.match(/Qatar[^\s\"<]*/gi));
  console.log('FontFamily matches:', xml.match(/fontFamily="[^"]+"/gi));
  console.log('FontName matches:', xml.match(/fontName="[^"]+"/gi));
  console.log('Font tag matches:', xml.match(/<[^>]*font[^>]*>/gi));
} else {
  console.log('xpacket not found');
}
