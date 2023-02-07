const generalService = require("../services/generalOperation");

const autoIncrement = async (table, fieldName, condition = {}) => {
  try {
    const aggregateArr = [
      { $match: condition },
      { $sort: { [fieldName]: -1 } },
      { $limit: 1 },
    ];
    const record = await generalService.getRecordAggregate(table, aggregateArr);

    console.log("===== record =====", JSON.stringify(record));
    if (record.length >= 1) {
      let count = parseInt(record[0][fieldName]);
      count += 1;
      return count;
    } else {
      return 1;
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  autoIncrement,
};
