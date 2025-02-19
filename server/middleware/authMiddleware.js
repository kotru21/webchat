import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } else {
      res.status(401).json({ message: "Не авторизован" });
    }
  } catch (error) {
    res.status(401).json({ message: "Не авторизован" });
  }
};

export default protect;
