export const STATES = [
    { label: "DRAFT", color: "gray" },
    { label: "POST", color: "blue" },
    { label: "CONFIRMED", color: "green" },
    { label: "DONE", color: "green" },
    { label: "BELUM_DIHITUNG", color: "red" },
];

export const getChartColor = (color) => {
    const colorMap = {
        gray: "#6B7280",
        blue: "#3B82F6",
        green: "#10B981",
        red: "#EF4444",
    };
    return colorMap[color] || "#6B7280";
};
