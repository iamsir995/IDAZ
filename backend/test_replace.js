const mongoose = require('mongoose');
const assetSchema = new mongoose.Schema({ url: String });
const Asset = mongoose.model('AssetTest', assetSchema);

const replaceUploads = (obj) => {
  if (obj && typeof obj.toJSON === 'function') {
    obj = obj.toJSON();
  }
  
  if (typeof obj === 'string' && obj.startsWith('/uploads/')) {
    return `http://localhost:5000${obj}`;
  } else if (Array.isArray(obj)) {
    return obj.map(replaceUploads);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = replaceUploads(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

const doc = new Asset({ url: '/uploads/test.jpg' });
const body = { success: true, data: [doc] };
console.log("Replaced:", JSON.stringify(replaceUploads(body)));
