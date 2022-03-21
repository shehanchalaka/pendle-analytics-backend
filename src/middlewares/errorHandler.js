const errorHandler = (err, req, res, next) => {
  if (typeof err === "object") {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err?.message });
    }

    if (err.name === "UnauthorizedError") {
      return res.status(401).json({ message: err?.message });
    }

    return res.status(400).json({ message: err?.message });
  }

  // default to 500 server error
  return res.status(500).json({ message: "Internal Server Error" });
};

export default errorHandler;
