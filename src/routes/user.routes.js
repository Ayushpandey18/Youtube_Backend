import {Router} from "express"
import {registerUser,
    loginUser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getcurrentuser,
    updatedetails,
    updateAvatar,
    updatecoverImage,
    getchanneldetails,
    getwatchhistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";
const userRouter=Router();
userRouter.route("/register").post(
upload.fields([
    {name:"avatar",maxCount:1},
    {name:"coverimage",maxCount:1}
]),
registerUser);
userRouter.route("/login").post(
    loginUser);
    userRouter.route("/logout").post(verifyJWT,logoutuser);

    userRouter.route("/refresh-token").post(refreshAccessToken);
    userRouter.route("/change-password").post(verifyJWT,changeCurrentPassword)
    userRouter.route("/current-user").get(verifyJWT,getcurrentuser)
    userRouter.route("/update-details").patch(verifyJWT,updatedetails)
    userRouter.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
    userRouter.route("/update-coverimage").patch(verifyJWT,upload.single("coverimage"),updatecoverImage)
    userRouter.route("/channel/:username").get(verifyJWT,getchanneldetails)
    userRouter.route("/watch-history").get(verifyJWT,getwatchhistory)
export default userRouter;