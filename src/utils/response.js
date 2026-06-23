function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, meta: meta || undefined });
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function fail(res, status, message, details) {
  return res.status(status).json({
    success: false,
    error: { message, details: details || undefined }
  });
}

module.exports = { ok, created, fail };
