export class Chrono {
  startTime = new Date();
  label = "";

  start(label: string) {
    this.startTime = new Date();
    this.label = label;
    console.log(`[${this.label}] starting.`);
  }

  log() {
    const elapsed = new Date().getTime() - this.startTime.getTime();
    console.log(`[${this.label}] elapsed=${elapsed}ms`);
  }
}
