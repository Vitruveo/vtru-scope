class Calculator {

  assumptions = {
    beginningUnits: 2_000_000,
    unitPrices: [0.5, 4, 8, 12, 20],
    vtruStaked: 10000,
    vtroSwapped: 0,
    initialProjects: 15, 
    initialProjectFunding: 600_000,
    newCommunityUnits: 5_000_000,
    operationsMultiplier: 150_000,
    projectSuccessRate: {
      fail: 25,
      breakeven: 28,
      moderate: 44,
      blockbuster: 3
    },
    verseRevenueShare: 5000,
    verseRevenueShareAnnualIncrease: 500,
    vibeRevenueShare: 1000,
    moderateRevenueMultiplier: 4,
    blockbusterRevenueMultiplier: 50,
    newProjectsUnitsMultiplier: 100_000,
  };

roundToDecimals(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
  
roundObjectValuesInPlace(obj, decimals) {
  Object.keys(obj).forEach(key => {
    obj[key] = this.roundToDecimals(obj[key], decimals);
  });
}

  pivotData(data, startYear) {
    if (!data || data.length === 0) {
      return {};
    }
  
    const result = { };
  
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

  calculateProjections(startYear, assumptions) {

    assumptions = assumptions || this.assumptions;

    const annualIncomeProjections = [];
    const detailedProjections = [];

    for (let year = 0; year < 5; year++) {


      const beginningUnits = year == 0 ? assumptions.beginningUnits : detailedProjections[year-1].endingUnits;
      const unitPrice = assumptions.unitPrices[year];
      const newCommunityUnits = year == 0 ? assumptions.newCommunityUnits : 0;

      const averageFunding = assumptions.initialProjectFunding + (year * 100_000);

      let projects = year == 0 ? assumptions.initialProjects : Math.max(0, Math.round(((detailedProjections[year-1].cashFlowEnding * 0.9)/averageFunding)/5)*5); 
      const projectFunding = projects * averageFunding;
      const operations = year == 0 ? projects * assumptions.operationsMultiplier :  Math.round(detailedProjections[year-1].operations * 1.25);

      const publicFunding = year == 0 ? (Math.round((projectFunding + operations)/500_000) * 500_000) + 1_000_000 : (year == 1 ? Math.round(detailedProjections[year-1].publicFunding * 3) : 0);
      const publicSaleUnits = year == 0 ? 5_000_000 : 1_000_000; //publicFunding / unitPrice;
      const totalExpenses = projectFunding + operations;


      const blockbusterProjects = Math.max(0, Math.trunc(projects * assumptions.projectSuccessRate.blockbuster/100));
      const moderateProjects = Math.max(0, Math.trunc(projects * assumptions.projectSuccessRate.moderate/100));
      const breakevenProjects = Math.max(0, Math.trunc(projects * assumptions.projectSuccessRate.breakeven/100));
      const failProjects = projects - blockbusterProjects - moderateProjects - breakevenProjects;

      const newProjectUnits = (moderateProjects + blockbusterProjects) * assumptions.newProjectsUnitsMultiplier;
      const endingUnits = beginningUnits + publicSaleUnits + newCommunityUnits + newProjectUnits;

      const moderateRevenue = moderateProjects * averageFunding * assumptions.moderateRevenueMultiplier;
      const blockbusterRevenue = blockbusterProjects * averageFunding * assumptions.blockbusterRevenueMultiplier;
      const totalRevenue = moderateRevenue + blockbusterRevenue;

      const totalProfit = totalRevenue - totalExpenses;

      const verseRevenueShare = Math.max(0, Math.round(totalProfit * (assumptions.verseRevenueShare + (assumptions.verseRevenueShareAnnualIncrease * year))/10000));
      const vibeRevenueShare = Math.max(0, Math.round(totalProfit * assumptions.vibeRevenueShare/10000));

      const revenueSharePerVerseUnit = this.roundToDecimals(verseRevenueShare / endingUnits, 2);

      const cashFlowBeginning = year == 0 ? publicFunding : detailedProjections[year-1].cashFlowEnding + publicFunding;
      const cashFlowEnding = cashFlowBeginning + totalProfit - verseRevenueShare - vibeRevenueShare;

      const marketCap = Math.round(endingUnits * unitPrice);
      annualIncomeProjections.push(this.roundToDecimals((assumptions.vtruStaked + Math.trunc(assumptions.vtroSwapped / 10)) * revenueSharePerVerseUnit, 0));

      detailedProjections.push({

          revenueSharePerVerseUnit,

          projectFundingTitle: [''],
          projects,
          averageFunding,

          projectSuccessRateTitle:  [''],
          failProjects,
          breakevenProjects,
          moderateProjects,
          blockbusterProjects,

          verseUnitsTitle: [''],
          beginningUnits,
          newCommunityUnits,
          publicSaleUnits,
          newProjectUnits,
          endingUnits,

          marketCapTitle: [''],
          // unitPrice,
          // marketCap,
          publicFunding,



          revenueTitle:  [''],
          moderateRevenue,
          blockbusterRevenue,
          totalRevenue,

          expensesTitle:  [''],
          projectFunding,
          operations,
          totalExpenses,

          incomeTitle:  [''],
          totalProfit,

          revenueShareTitle:  [''],
          verseRevenueShare,
          vibeRevenueShare,

        
          cashFlowTitle: [''],
          cashFlowBeginning,
          cashFlowEnding

        });

    }

    return {annual: annualIncomeProjections, detail: this.pivotData(detailedProjections, startYear)}
  }


}

module.exports = Calculator;