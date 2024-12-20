class Calculator {
  snapshots = [];

  holdings = {};

  assumptions = {
    revenue: {
      arts: { start:150_000_000, growth: 100, revShare: 0.05 },
      gaming: { start: 50_000_000, growth: 100, revShare: 0.10 },
      entertainment: { start: 50_000_000, growth: 200, revShare: 0.10 },
    },
    price: {
      vtru: { start: 0.20, growth: 10 },
      vtro: { start: 0.02, growth: 5 },
    },
    supply: {
      verse: {start: 250_000_000, growth: 300 }
    }
  };

  rebaseRate = [1.15, 1.23, 1.30, 1.45, 1.50];
  stakingAPR = [.15, .23, .30, .45, .50];
  stakingDays = [365, 730, 1095, 1460, 1825];
  curve = [0.4, 0.3, 0.15, 0.10, 0.05];

  calculateInterimValues(start, finalPercentage) {
    const values = [];
    this.curve.forEach((value, index) => {
        const weightedValue = (value * start) * (finalPercentage/100);
        values.push(index == 0 ? start + weightedValue : values[index-1] + weightedValue);
    });

    return values;
}

calculateInterimPriceValues(start, finalPrice) {
  const values = [];
  const growth = finalPrice - start;
  this.curve.forEach((value, index) => {
      const weightedValue = (growth * value);
      values.push(index == 0 ? start + weightedValue : values[index-1] + weightedValue);
  });

  return values;
}

  roundToDecimals(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
  
  roundObjectValuesInPlace(obj, decimals) {
    Object.keys(obj).forEach(key => {
      obj[key] = this.roundToDecimals(obj[key], decimals);
    });
  }

  calculateGrowth(max) {
    const curve = [0.4, 0.3, 0.15, 0.10, 0.05];
    return [max * curve[0], max * curve[1], max * curve[2], max * curve[3], max * curve[4]];
  }

  pivotData(data, startYear) {
    if (!data || data.length === 0) {
      return {};
    }
  
    const result = { };
  
    // Populate the years array
    // for (let i = 0; i < data.length; i++) {
    //   result.years.push(startYear + i);
    // }
  
    // Populate the properties
    data.forEach((entry, index) => {
      Object.keys(entry).forEach((key) => {
        if (!result[key]) {
          result[key] = [];
        }
        result[key][index] = entry[key];
      });
    });
  
    return result;
  }

  constructor() {
  }

  calculateProjections(startYear, holdings, assumptions) {

    this.holdings = holdings;

    let startWalletVTRU = this.roundToDecimals(holdings.vtru, 2);
    let endWalletVTRU = this.roundToDecimals(startWalletVTRU, 2);
    let walletVTRO = holdings.vtro;

    let revenues = this.calculateAnnualRevenue( assumptions.revenue );
    let prices = this.calculateAnnualPrices( assumptions.price );
    let supply = this.calculateAnnualSupply(assumptions.supply );

    console.log('Prices',assumptions.price, prices)
    const projectionData = [];

    for (let year = 0; year < 5; year++) {

      const vtruPrice = this.roundToDecimals(prices.vtru[year], 4);

      const vtroPrice = this.roundToDecimals(prices.vtro[year], 4);

      const vibeIncome = this.roundToDecimals(this.calculateVibeIncome(revenues, year, holdings.vibe), 0);
      endWalletVTRU += vibeIncome;

      const verseIncome = this.roundToDecimals(this.calculateVerseIncome(revenues, supply.verse[year], year, holdings.verse), 0);
      endWalletVTRU += verseIncome;

      let {
        unstaked: unstakedVTRU,
        rewards: stakingIncome
      } = this.calculateStakingRewards(holdings.vtruStaked, year);

      endWalletVTRU += unstakedVTRU + stakingIncome;

      const rebasedWalletVTRU = this.roundToDecimals(endWalletVTRU + this.calculateRebase(endWalletVTRU, year), 0);
      const rebasedWalletVTRUUSD = this.roundToDecimals(rebasedWalletVTRU * vtruPrice, 0);
      const walletVTROUSD = this.roundToDecimals(holdings.vtro * vtroPrice, 0);

      endWalletVTRU = this.roundToDecimals(endWalletVTRU, 0);
      unstakedVTRU = this.roundToDecimals(unstakedVTRU, 0);
      stakingIncome = this.roundToDecimals(stakingIncome, 0);

      const totalWalletUSD = this.roundToDecimals(rebasedWalletVTRUUSD + walletVTROUSD, 0);

      projectionData.push({

          price: ['', '', '', '', ''],
          vtruPrice,
          vtroPrice,

          vtru: ['', '', '', '', ''],

          startWalletVTRU,
          unstakedVTRU,
          endWalletVTRU,

          vtro: ['', '', '', '', ''],
          walletVTRO,
          walletVTROUSD,

          income: ['', '', '', '', ''],
          vibeIncome,
          verseIncome,
          stakingIncome,


          rebased: ['', '', '', '', ''],
          rebasedWalletVTRU,
          rebasedWalletVTRUUSD,

          total: ['', '', '', '', ''],
          totalWalletUSD,


          revenue: ['', '', '', '', ''],
          artsRevenue: revenues.arts[year],
          gamingRevenue: revenues.gaming[year],
          entertainmentRevenue: revenues.entertainment[year],
          //supply: supply.verse[year],


        });

      // Update only after storing
      startWalletVTRU = this.roundToDecimals(endWalletVTRU, 2);

    }

    return this.pivotData(projectionData, startYear)
  }

  calculateRebase(vtru, year) {
    const rebasedAmount = vtru * this.rebaseRate[year];
    return rebasedAmount - vtru;
  }

  calculateAnnualRevenue(revenueAssumptions) {
    const arts = this.calculateInterimValues(revenueAssumptions.arts.start, revenueAssumptions.arts.growth);
    const gaming = this.calculateInterimValues(revenueAssumptions.gaming.start, revenueAssumptions.gaming.growth);
    const entertainment = this.calculateInterimValues(revenueAssumptions.entertainment.start, revenueAssumptions.entertainment.growth);

    return {arts, gaming, entertainment}
  }

  calculateAnnualPrices(priceAssumptions) {
    const vtru = this.calculateInterimPriceValues(priceAssumptions.vtru.start, priceAssumptions.vtru.growth);
    const vtro = this.calculateInterimPriceValues(priceAssumptions.vtro.start, priceAssumptions.vtro.growth);

    return {vtru, vtro}
  }

  calculateAnnualSupply(supplyAssumptions) {
    const verse = this.calculateInterimValues(supplyAssumptions.verse.start, supplyAssumptions.verse.growth);

    return {verse}
  }

  calculateVibeIncome(revenues, year, vibeTokens) {
    const vibeRevenue =
      revenues.arts[year] * this.assumptions.revenue.arts.revShare +
      revenues.gaming[year] * this.assumptions.revenue.gaming.revShare  +
      revenues.entertainment[year] * this.assumptions.revenue.entertainment.revShare;

    return (vibeTokens / 1_000_000) * vibeRevenue; // Fixed total supply of 1,000,000 for VIBE
  }

  calculateVerseIncome(revenues, verseSupply, year, verseTokens) {
    const verseRevenue =
      revenues.entertainment[year] * this.assumptions.revenue.entertainment.revShare;

    return (verseTokens / verseSupply) * verseRevenue;
  }

  calculateStakingRewards(vtruStaked, year) {
    
    let unstaked = 0;
    let rewards = 0;

    vtruStaked.forEach((staked, term) => {
      //console.log('Info', staked, term, year)
      if (term === year) {
        unstaked += staked;
        const rewardPerDay = Math.trunc(((staked * this.stakingAPR[term]) / 365) * 100)/100;
        //console.log('Reward', staked, this.stakingAPR[term], rewardPerDay, this.stakingDays[term], rewardPerDay * this.stakingDays[term])
        rewards += Math.trunc(rewardPerDay * this.stakingDays[term]);
      }
    });

    return {
      unstaked,
      rewards
    };
  }

  snapshotExists() {
    return Boolean(typeof localStorage !== "undefined" && localStorage.getItem("calculatorSnapshot"));
  }

  saveSnapshot() {
    if (typeof localStorage !== "undefined") {
      const snapshot = {
        assumptions: this.assumptions,
        holdings: this.holdings,
      };
      localStorage.setItem("calculatorSnapshot", JSON.stringify(snapshot));
      console.log("Snapshot saved!");
    } else {
      console.log("localStorage is not available in this environment.");
    }
  }

  loadSnapshot() {
    if (typeof localStorage !== "undefined") {
      const snapshot = localStorage.getItem("calculatorSnapshot");
      if (snapshot) {
        const parsed = JSON.parse(snapshot);
        this.assumptions = parsed.assumptions;
        this.holdings = parsed.holdings;
        console.log("Snapshot loaded!");
        return parsed.assumptions;
      }
    } else {
      console.log("localStorage is not available in this environment.");
    }
    return null;
  }

  clearSnapshot() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("calculatorSnapshot");
      console.log("Snapshot cleared!");
    } else {
      console.log("localStorage is not available in this environment.");
    }
  }

}

module.exports = Calculator;