class ConsumptionCalculator {

  //Різниця між показниками
  static calculateConsumption(currentReading, previousReading = null) {
    if (previousReading === null) {
      return parseFloat(currentReading); // перше показання
    }

    const consumption = parseFloat(currentReading) - parseFloat(previousReading);

    if (consumption < 0) {
      throw new Error(
        "Invalid meter reading: consumption cannot be negative. New reading must be >= previous reading."
      );
    }

    return consumption;
  }

  // Прямий метод (тільки різниця між показниками)
  static calculateDirect(consumption) {
    return {
      direct_consumption: parseFloat(consumption),
      area_based_consumption: 0,
      total_consumption: parseFloat(consumption),
    };
  }


   //Метод "за площею" (наприклад, беремо тільки areaBasedConsumption)
  static calculateAreaBased(areaBasedConsumption) {
    return {
      direct_consumption: 0,
      area_based_consumption: parseFloat(areaBasedConsumption),
      total_consumption: parseFloat(areaBasedConsumption),
    };
  }

  //Змішаний метод (поєднання)
  static calculateMixed(consumption, areaBasedConsumption) {
    const direct = parseFloat(consumption) || 0;
    const area = parseFloat(areaBasedConsumption) || 0;

    return {
      direct_consumption: direct,
      area_based_consumption: area,
      total_consumption: direct + area,
    };
  }

  //Розрахунок total cost
  static calculateTotalCost(totalConsumption, unitPrice) {
    return parseFloat(totalConsumption) * parseFloat(unitPrice);
  }
}

module.exports = ConsumptionCalculator;

  