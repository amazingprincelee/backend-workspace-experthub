const yup = require("yup");

const registrationSchema = yup.object().shape({
  userType: yup.string().required("User type is required").oneOf(["provider", "client"], "User type must be either Provider or Client"),
  fullname: yup.string().required("Full name is required").min(2, "Full name must be at least 2 characters"),
  email: yup.string().required("Email is required").email("Invalid email format"),
  phone: yup.string().required("Phone number is required").matches(/^\+?[\d\s-]{10,}$/, "Invalid phone number format"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
  address: yup.string().required("Address is required").min(5, "Address must be at least 5 characters"),
  password: yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
  companyName: yup.string().notRequired(), 
});

const validateRegistration = async (req, res, next) => {
  try {
    const validationData = {
      userType: req.body.userType,
      fullname: req.body.fullname,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country,
      state: req.body.state,
      address: req.body.address,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      contact: req.body.contact,
      companyName: req.body.companyName,
    };

    await registrationSchema.validate(validationData, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.inner.reduce((acc, curr) => {
      acc[curr.path] = curr.message;
      return acc;
    }, {});
    return res.status(400).json({ message: "Validation failed", errors });
  }
};

module.exports = { validateRegistration };