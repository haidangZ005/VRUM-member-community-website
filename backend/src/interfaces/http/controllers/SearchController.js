function makeSearchController(useCases) {
  return {
    async search(req, res) {
      return res.json(await useCases.searchContent.execute(req.validatedQuery));
    },
  };
}

module.exports = makeSearchController;
