

const determineRole = (userType) => {

    switch (userType) {
        case "student":
            return "student";

        case "tutor":
            return "tutor";

        case "admin":
            return "admin";

        default:
            return "student";
    }

}


module.exports = determineRole;
