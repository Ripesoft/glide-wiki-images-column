const functions = new Map();

window.function = function (code, ...params) {
  // Ignore incoming code and params — always return the same string
  return "this works";
}
