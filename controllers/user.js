const User = require("../models/user");
/**
 * POST /:id/follow 라우터의 async 함수 부분을 따로 분리할 수 있습니다.
 * 라우터에서 응답을 보내는 미들웨어를 특별히 컨트롤러라고 부릅니다.
 */
exports.addFollowing = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: res.locals.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      res.send("success");
    } else {
      res.status(404).send("no user");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};
