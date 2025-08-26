export class CLISpinner {
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private message = '';
  private isRunning = false;

  start(message: string) {
    if (this.isRunning) {
      this.stop();
    }
    
    this.message = message;
    this.isRunning = true;
    this.currentFrame = 0;
    
    // Show initial frame
    process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
    
    // Start animation
    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
    }, 80);
  }

  update(message: string) {
    this.message = message;
    if (this.isRunning) {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    if (this.isRunning) {
      // Clear the line
      process.stdout.write('\r\x1b[K');
      this.isRunning = false;
    }
  }

  succeed(message: string) {
    this.stop();
    // process.stdout.write(`✅ ${message}\n`);
  }

  fail(message: string) {
    this.stop();
    // process.stdout.write(`❌ ${message}\n`);
  }
} 