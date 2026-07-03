const startQuest = require("./questEngine");

function createQuestRoute(searchText, questName) {

    return async (req, res) => {

        try {

            const location = req.query.location;

            if (!location) {
                return res.status(400).json({
                    error: "Please provide a location."
                });
            }

            const result = await startQuest(
                location,
                searchText,
                process.env.GOOGLE_API_KEY
            );

            result.quest = questName;

            res.json(result);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

}

module.exports = createQuestRoute;