import * as qoService from "./QO.service.js";
export const createQOProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, region } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }

    const qo = await qoService.createQOProfile(userId, {
      fullName,
      phone,
      region,
    });

    return res.status(201).json({
      message: "Quality Officer profile created successfully",
      data: qo,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyQOProfile = async (req, res, next) => {
  try {
    const qo = await qoService.getMyQOProfile(req.user.id);

    return res.status(200).json({ data: qo });
  } catch (error) {
    next(error);
  }
};

export const getQOById = async (req, res, next) => {
  try {
    const qo = await qoService.getQOById(req.params.id);

    return res.status(200).json({ data: qo });
  } catch (error) {
    next(error);
  }
};

export const updateQOProfile = async (req, res, next) => {
  try {
    const qo = await qoService.updateQOProfile(req.user.id, {
      fullName: req.body.fullName,
      phone: req.body.phone,
      region: req.body.region,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      data: qo,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQOStatus = async (req, res, next) => {
  try {
    if (!req.body.status) {
      return res.status(400).json({ message: "status is required" });
    }

    const qo = await qoService.updateQOStatus(
      req.user.id,
      req.body.status
    );

    return res.status(200).json({
      message: "Status updated successfully",
      data: qo,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllQOs = async (req, res, next) => {
  try {
    const qos = await qoService.getAllQOs(req.query);

    return res.status(200).json({ data: qos });
  } catch (error) {
    next(error);
  }
};