import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
          throw new Error("Пользователь не найден");
        }

        req.user = user;
        next();
      } catch (error) {
        console.error("Token verification failed:", error);
        res.status(401).json({ message: "Невалидный токен" });
      }
    } else {
      res.status(401).json({ message: "Не авторизован, токен отсутствует" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Ошибка авторизации" });
  }
};

export default protect;
