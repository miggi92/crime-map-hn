export default defineTask({
    meta: {
        name: "db:fetch-historical-news",
        description: "Fetch historical news",
    },
    run({ payload, context }) {
        console.log("Running DB migration task...");
        return { result: "Success" };
    },
});
