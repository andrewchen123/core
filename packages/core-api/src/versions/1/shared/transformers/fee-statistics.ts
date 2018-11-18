export default function(model: any) {
  return {
    type: model.type,
    fees: {
      minFee: parseInt(model.minFee),
      maxFee: parseInt(model.maxFee),
      avgFee: parseInt(model.avgFee),
    },
  };
}
