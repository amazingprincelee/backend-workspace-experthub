

const determineRole = (userType) => {

    switch (userType) {
        case "student":
            return "student";
        case "client":
            return "client";

        case "tutor":
            return "tutor";
        case "provider":
            return "provider";

        case "admin":
            return "admin";

        default:
            return "student";
    }

}


module.exports = determineRole;
