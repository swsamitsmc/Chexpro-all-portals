export const validateFormInput = (req, res, next) => {
    const { firstName, lastName, email, phone, companyName, message } = req.body;

    // Define max lengths for fields
    const MAX_LENGTHS = {
        firstName: 50,
        lastName: 50,
        email: 100,
        phone: 20,
        companyName: 100,
        message: 1000,
    };

    // Check lengths
    if (firstName && firstName.length > MAX_LENGTHS.firstName) {
        return res.status(400).json({ error: `First name exceeds maximum length of ${MAX_LENGTHS.firstName}` });
    }
    if (lastName && lastName.length > MAX_LENGTHS.lastName) {
        return res.status(400).json({ error: `Last name exceeds maximum length of ${MAX_LENGTHS.lastName}` });
    }
    if (email && email.length > MAX_LENGTHS.email) {
        return res.status(400).json({ error: `Email exceeds maximum length of ${MAX_LENGTHS.email}` });
    }
    if (phone && phone.length > MAX_LENGTHS.phone) {
        return res.status(400).json({ error: `Phone number exceeds maximum length of ${MAX_LENGTHS.phone}` });
    }
    if (companyName && companyName.length > MAX_LENGTHS.companyName) {
        return res.status(400).json({ error: `Company name exceeds maximum length of ${MAX_LENGTHS.companyName}` });
    }
    if (message && message.length > MAX_LENGTHS.message) {
        return res.status(400).json({ error: `Message exceeds maximum length of ${MAX_LENGTHS.message}` });
    }

    next();
};

export const validateRequestDemoInput = (req, res, next) => {
    const { firstName, lastName, jobTitle, companyName, workEmail, phone, screeningsPerYear, servicesOfInterest, message } = req.body;

    const MAX_LENGTHS = {
        firstName: 50,
        lastName: 50,
        jobTitle: 100,
        companyName: 100,
        workEmail: 100,
        phone: 20,
        screeningsPerYear: 50,
        servicesOfInterest: 500,
        message: 1000,
    };

    if (firstName && firstName.length > MAX_LENGTHS.firstName) {
        return res.status(400).json({ error: `First name exceeds maximum length of ${MAX_LENGTHS.firstName}` });
    }
    if (lastName && lastName.length > MAX_LENGTHS.lastName) {
        return res.status(400).json({ error: `Last name exceeds maximum length of ${MAX_LENGTHS.lastName}` });
    }
    if (jobTitle && jobTitle.length > MAX_LENGTHS.jobTitle) {
        return res.status(400).json({ error: `Job title exceeds maximum length of ${MAX_LENGTHS.jobTitle}` });
    }
    if (companyName && companyName.length > MAX_LENGTHS.companyName) {
        return res.status(400).json({ error: `Company name exceeds maximum length of ${MAX_LENGTHS.companyName}` });
    }
    if (workEmail && workEmail.length > MAX_LENGTHS.workEmail) {
        return res.status(400).json({ error: `Work email exceeds maximum length of ${MAX_LENGTHS.workEmail}` });
    }
    if (phone && phone.length > MAX_LENGTHS.phone) {
        return res.status(400).json({ error: `Phone number exceeds maximum length of ${MAX_LENGTHS.phone}` });
    }
    if (screeningsPerYear && screeningsPerYear.length > MAX_LENGTHS.screeningsPerYear) {
        return res.status(400).json({ error: `Screenings per year exceeds maximum length of ${MAX_LENGTHS.screeningsPerYear}` });
    }
    if (servicesOfInterest && servicesOfInterest.length > MAX_LENGTHS.servicesOfInterest) {
        return res.status(400).json({ error: `Services of interest exceeds maximum length of ${MAX_LENGTHS.servicesOfInterest}` });
    }
    if (message && message.length > MAX_LENGTHS.message) {
        return res.status(400).json({ error: `Message exceeds maximum length of ${MAX_LENGTHS.message}` });
    }

    next();
};