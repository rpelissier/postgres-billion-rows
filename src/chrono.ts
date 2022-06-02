export class Chrono {
  startTime = new Date();
  label = "";

  start(label: string) {
    this.startTime = new Date();
    this.label = label;
    console.log(`[${this.label}] starting.`);
  }

  elapsedLogAndGet() {
    const elapsedMs = new Date().getTime() - this.startTime.getTime();
    console.log(`[${this.label}] elapsed=${elapsedMs}ms`);
    return elapsedMs;
  }
}
