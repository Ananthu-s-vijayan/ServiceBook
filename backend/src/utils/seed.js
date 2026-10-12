require("dotenv").config();

const mongoose = require("mongoose");

const Category = require("../models/Category");
const Service = require("../models/Service");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Development MongoDB connected");
        console.log(`seed database name:${mongoose.connection.name}`)
    } catch (error) {
        console.error(
            "Development MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
};

const seedData = async () => {
    try {
        /*
         * Testing the development catalog seed:
         * This clears the existing development categories/services
         * and recreates the exact 9 services required by the
         * current ServiceBook Figma design.
         *
         * IMPORTANT:
         * This script is for development data only.
         * Do not run it against production data.
         */

        await Service.deleteMany({});
        await Category.deleteMany({});

        console.log("Existing development catalog cleared");

        // Create the 9 service categories used by the Service Catalog.
        const categories = [
            {
                name: "Plumbing",
                icon: "plumbing",
                description: "Professional plumbing services",
                isActive: true
            },
            {
                name: "Electrical",
                icon: "electrical",
                description: "Professional electrical services",
                isActive: true
            },
            {
                name: "AC Repair",
                icon: "ac-repair",
                description: "Air conditioner servicing and repair",
                isActive: true
            },
            {
                name: "Cleaning",
                icon: "cleaning",
                description: "Home cleaning services",
                isActive: true
            },
            {
                name: "Painting",
                icon: "painting",
                description: "Interior and exterior painting services",
                isActive: true
            },
            {
                name: "Carpentry",
                icon: "carpentry",
                description: "Carpentry and woodwork services",
                isActive: true
            },
            {
                name: "Appliance",
                icon: "appliance",
                description: "Home appliance repair and servicing",
                isActive: true
            },
            {
                name: "Smart Home",
                icon: "smart-home",
                description: "Smart home and security services",
                isActive: true
            },
            {
                name: "Pest Control",
                icon: "pest-control",
                description: "Pest control and fumigation services",
                isActive: true
            }
        ];

        const categoryMap = {};

        for (const categoryData of categories) {
            const category = await Category.create(categoryData);

            categoryMap[category.name] = category._id;

            console.log(
                `Created category: ${category.name}`
            );
        }

        /*
         * Service image paths:
         *
         * These are public Vite paths.
         * Files must exist inside:
         *
         * frontend/public/services/
         *
         * Example:
         * frontend/public/services/HomeCleaning.png
         *
         * The browser accesses that file as:
         * /services/HomeCleaning.png
         */

        const services = [
            {
                categoryName: "Plumbing",
                title: "Plumbing Repair & Fitting",
                sku: "SRV-PLM-01",
                shortDescription:
                    "Fix leaks, burst pipes, taps, bathroom fittings, blockages & water heater installation with precision.",
                description:
                    "Professional plumbing repair and fitting services.",
                pricingType: "hourly",
                pricePerHour: 300,
                estimatedDuration: null,
                imageUrl: "/services/Plumber.png",
                isActive: true
            },

            {
                categoryName: "Electrical",
                title: "Electrical Setup & Diagnostics",
                sku: "SRV-ELC-02",
                shortDescription:
                    "Wiring, power backup, switchboards, lighting setup, short circuit diagnostics & fan repair.",
                description:
                    "Professional electrical setup, repair and diagnostic services.",
                pricingType: "hourly",
                pricePerHour: 350,
                estimatedDuration: null,
                imageUrl: "/services/Electrical.png",
                isActive: true
            },

            {
                categoryName: "AC Repair",
                title: "AC Servicing & Gas Refill",
                sku: "SRV-ACR-03",
                shortDescription:
                    "Complete service, deep chemical foam wash, gas refill, filter cleaning & compressor installation.",
                description:
                    "Professional air conditioner servicing and repair.",
                pricingType: "hourly",
                pricePerHour: 400,
                estimatedDuration: null,
                imageUrl: "/services/Ac.png",
                isActive: true
            },

            {
                categoryName: "Cleaning",
                title: "Home Deep Cleaning",
                sku: "SRV-CLN-04",
                shortDescription:
                    "Intensive deep cleaning for kitchen, bathrooms, living spaces & sofa sanitization with commercial equipment.",
                description:
                    "Professional deep cleaning services for home spaces.",
                pricingType: "hourly",
                pricePerHour: 250,
                estimatedDuration: null,

                // File: frontend/public/services/HomeCleaning.png
               imageUrl: "/services/HomeClean.png",

                isActive: true
            },

            {
                categoryName: "Painting",
                title: "Interior & Exterior Painting",
                sku: "SRV-PNT-05",
                shortDescription:
                    "Wall painting, waterproof damp coating, texture designs, and smooth spray finishes with color consultation.",
                description:
                    "Interior and exterior painting services for residential spaces.",
                pricingType: "hourly",
                pricePerHour: 350,
                estimatedDuration: null,
                imageUrl: "/services/Painting.png",
                isActive: true
            },

            {
                categoryName: "Carpentry",
                title: "Carpentry & Woodwork",
                sku: "SRV-CRP-06",
                shortDescription:
                    "Door lock repair, modular furniture assembly, wardrobe hinge replacement, and custom woodwork crafting.",
                description:
                    "Professional carpentry, furniture assembly and woodwork services.",
                pricingType: "hourly",
                pricePerHour: 300,
                estimatedDuration: null,
                imageUrl: "/services/Carpenter.png",
                isActive: true
            },

            {
                categoryName: "Appliance",
                title: "Appliance Repair & Servicing",
                sku: "SRV-APP-07",
                shortDescription:
                    "Washing machine, refrigerator, microwave, and kitchen appliance diagnostics and repairs.",
                description:
                    "Professional repair and servicing for common home appliances.",
                pricingType: "hourly",
                pricePerHour: 299,
                estimatedDuration: null,

                // File: frontend/public/services/ApplianceCleaning.png
                imageUrl: "/services/ApplianceClean.png",

                isActive: true
            },

            {
                categoryName: "Smart Home",
                title: "Smart Home & Security",
                sku: "SRV-SEC-08",
                shortDescription:
                    "CCTV camera installation, smart lock setup, video doorbells, and IoT home automation.",
                description:
                    "Smart home automation and security installation services.",
                pricingType: "hourly",
                pricePerHour: 499,
                estimatedDuration: null,
                imageUrl: "/services/SmartHome.png",
                isActive: true
            },

            {
                categoryName: "Pest Control",
                title: "Pest Control & Fumigation",
                sku: "SRV-PST-09",
                shortDescription:
                    "Comprehensive herbal pest control for termites, cockroaches, bedbugs, and mosquito fogging.",
                description:
                    "Professional pest control and fumigation services.",
                pricingType: "hourly",
                pricePerHour: 399,
                estimatedDuration: null,
                imageUrl: "/services/PestControl.png",
                isActive: true
            }
        ];

        for (const serviceData of services) {
            const categoryId =
                categoryMap[serviceData.categoryName];

            await Service.create({
                categoryId,
                title: serviceData.title,
                sku: serviceData.sku,
                shortDescription:
                    serviceData.shortDescription,
                description:
                    serviceData.description,
                pricingType:
                    serviceData.pricingType,
                pricePerHour:
                    serviceData.pricePerHour,
                estimatedDuration:
                    serviceData.estimatedDuration,
                imageUrl:
                    serviceData.imageUrl,
                isActive:
                    serviceData.isActive
            });

            console.log(
                `Created service: ${serviceData.title}`
            );
        }

        console.log(
            "Development catalog seeded successfully with 9 services"
        );
        console.log(
    "Service count:",
    await Service.countDocuments()
);

console.log(
    "Category count:",
    await Category.countDocuments()
);
    } catch (error) {
        console.error(
            "Development seed failed:",
            error.message
        );
    } finally {
        await mongoose.connection.close();

        console.log("MongoDB connection closed");
    }
};

const runSeed = async () => {
    await connectDB();
    await seedData();
};

runSeed();