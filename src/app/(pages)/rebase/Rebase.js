class Rebase {
  INTEREST_PER_EPOCH = 100087671;
  DIVISOR = Math.pow(10, 8);

  rebaseTable = [100000000];

  constructor() {
    this.calculateRebaseTable();
  }

  formatDays(days) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;

    let result = [];

    if (years > 0) result.push(`${years} year${years > 1 ? 's' : ''}`);
    if (remainingDays > 0) result.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);

    return result.length > 0 ? result.join(', ') : '0 days';
 }


  calculateRebaseTable() {
    for(let r=1; r<1629; r++) {
      const currentRebase = this.rebaseTable.length;
      let newRebase = Math.trunc((this.rebaseTable[currentRebase - 1] * this.INTEREST_PER_EPOCH) / this.DIVISOR);
      this.rebaseTable.push(newRebase);
    }
  }
}

module.exports = Rebase;