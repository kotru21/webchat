import User from "../Models/userModel.js";

export const updateProfile = async (req, res) => {
  try {
    const { username, description } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (username) user.username = username;
    if (description) user.description = description;

    if (req.files) {
      if (req.files.avatar) {
        user.avatar = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }
      if (req.files.banner) {
        user.banner = `/uploads/banners/${req.files.banner[0].filename}`;
      }
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при обновлении профиля", error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при получении профиля", error: error.message });
  }
};
