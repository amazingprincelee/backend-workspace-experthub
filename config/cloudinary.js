import {v2 as cloudinary} from 'cloudinary';
          
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
  
  export default  upload ;