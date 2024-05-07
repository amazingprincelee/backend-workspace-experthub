const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'peoples-power-technology',
  api_key: '741617957557579',
  api_secret: 'SzPorCF6VXl9iRMOvitjLaQFSy4'
});



const upload = async (file) => {
  const image = await cloudinary.uploader.upload(
    file,
    (result) => result
  );
  return image;
};

const cloudinaryVidUpload = async (asset) => {
  try {
    const res = await cloudinary.uploader.upload(asset, {
      resource_type: "video",
      chunk_size: 6000000,
      eager: [
        { width: 300, height: 300, crop: "pad", audio_codec: "none" },
        { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }],
      eager_async: true,
    });
    return res.secure_url;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};


// module.exports.cloudinaryVidUpload = cloudinaryVidUpload;
module.exports = { upload, cloudinaryVidUpload };