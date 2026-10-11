// ============================================================
// FINANZE
// CORE CONDIVISO
// VERSIONE 0.12-B
// ============================================================

var FinanzeCore = {

    versione: "0.12-B",

    arrotonda2: function(valore) {
        var n = Number(valore);
        if (!isFinite(n)) {
            n = 0;
        }
        return Math.round(n * 100) / 100;
    },

    numero: function(valore) {
        var n = Number(valore);
        return isFinite(n) ? n : 0;
    },

    dueCifre: function(valore) {
        return valore < 10
            ? "0" + valore
            : String(valore);
    },

    dataOraBreve: function(valore) {
        if (!valore) {
            return "";
        }

        var data = new Date(valore);

        if (isNaN(data.getTime())) {
            return "";
        }

        return (
            FinanzeCore.dueCifre(data.getDate()) +