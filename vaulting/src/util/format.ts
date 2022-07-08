const base64Threshold = 1000;

export function removeBase64(body) {
  var _body = Object.assign({}, body);
  // loop through body and params and shorten base64 data
  for (const key in _body) {
    if (key.includes('base64')) {
      // shorten base64 data
      _body[key] = _body[key].substring(0, 100) + '......';
    }

    if (key.includes('image') && _body[key].length > base64Threshold) {
      // shorten base64 data
      _body[key] = _body[key].substring(0, 100) + '......';
    }
  }

  return _body;
}
