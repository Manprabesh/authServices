import crypto from "crypto";
import User from "../models/user.js";
import { getRedisClient } from "../config/redis.js";
import bcrypt from "bcrypt";
import { getTransporter, sendOTP } from "../config/mail.js";
import jwt from "jsonwebtoken";

export const registerController = async (req, res) => {
  try {

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email
    });


    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    // Generate 6 digit verification code
    const verificationCode = crypto
      .randomInt(100000, 999999)
      .toString();

    // Save in Redis
    // Key expires in 5 minutes
    const client = await getRedisClient()

    await client.set(
      `verify:${email}`,
      JSON.stringify({
        email,
        password,
        verificationCode
      }),
      {
        EX: 60 * 5
      }
    );

    //Send OTP to email
    const message = sendOTP(email, verificationCode);
    const info = await getTransporter().sendMail(message);
    console.log("email info ", info)
    return res.status(200).json({
      success: true,
      message: "OTP send successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const verifyOtpController = async (req, res) => {
  try {

    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    // Get data from Redis
    const client = await getRedisClient();
    const storedData = await client.get(
      `verify:${email}`
    );

    // OTP expired or not found
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid"
      });
    }

    const parsedData = JSON.parse(storedData);

    // Verify OTP
    if (parsedData.verificationCode !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Check again if user exists
    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      parsedData.password,
      10
    );

    // Create user
    const user = await User.create({
      email: parsedData.email,
      password: hashedPassword,
      isVerified: true
    });

    // Delete OTP data from Redis
    await client.del(`verify:${email}`);


    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        // role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );

    const refreshToken = crypto
      .randomBytes(64)
      .toString("hex");

    // Save refresh token in DB
    user.refreshTokens.push(refreshToken);

    await user.save();
    // =========================
    // SET REFRESH COOKIE
    // =========================
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    // =========================
    // SEND ACCESS TOKEN
    // =========================

    return res.status(201).json({
      success: true,
      message: "User registered successfully",

      accessToken,

      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const loginController = async (req, res) => {
  try {

    const { email, password } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // =========================
    // FIND USER
    // =========================

    const user = await User.findOne({
      email
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // =========================
    // VERIFY PASSWORD
    // =========================

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // =========================
    // ACCESS TOKEN
    // =========================

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );

    // =========================
    // REFRESH TOKEN
    // =========================

    const refreshToken = crypto
      .randomBytes(64)
      .toString("hex");

    // Save refresh token
    user.refreshTokens.push(refreshToken);

    user.lastLogin = new Date();

    await user.save();

    // =========================
    // SET COOKIE
    // =========================

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      accessToken,

      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const logoutController = async (req, res) => {
  try {

    // =========================
    // GET REFRESH TOKEN
    // =========================

    const refreshToken =
      req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token not found"
      });
    }

    // =========================
    // FIND USER WITH TOKEN
    // =========================

    const user = await User.findOne({
      refreshTokens: refreshToken
    });

    if (user) {

      // Remove refresh token
      user.refreshTokens =
        user.refreshTokens.filter(
          (token) =>
            token !== refreshToken
        );

      await user.save();
    }

    // =========================
    // CLEAR COOKIE
    // =========================

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const refreshTokenController = async (req, res) => {

  try {

    // =========================
    // GET REFRESH TOKEN
    // =========================

    const refreshToken =
      req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing"
      });
    }

    // =========================
    // FIND USER
    // =========================

    const user = await User.findOne({
      refreshTokens: refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    // =========================
    // CREATE NEW ACCESS TOKEN
    // =========================

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      accessToken
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};