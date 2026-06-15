class OperationHistory {
  constructor(limit = 25) {
    this.limit = limit;
    this.stack = [];
  }

  push(operation) {
    this.stack.push({
      ...operation,
      recordedAt: new Date().toISOString(),
    });

    if (this.stack.length > this.limit) {
      this.stack.shift();
    }
  }

  undo() {
    return this.stack.pop();
  }

  peek() {
    return this.stack[this.stack.length - 1] || null;
  }

  size() {
    return this.stack.length;
  }

  toArray() {
    return [...this.stack].reverse();
  }
}

module.exports = OperationHistory;
