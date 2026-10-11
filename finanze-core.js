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
            "/" +
            FinanzeCore.dueCifre(data.getMonth() + 1) +
            "/" +
            data.getFullYear() +
            " " +
            FinanzeCore.dueCifre(data.getHours()) +
            ":" +
            FinanzeCore.dueCifre(data.getMinutes())
        );
    },

    dataOraEditor: function(valore) {
        var data = valore
            ? new Date(valore)
            : new Date();

        if (isNaN(data.getTime())) {
            data = new Date();
        }

        return (
            FinanzeCore.dueCifre(data.getDate()) +
            "/" +
            FinanzeCore.dueCifre(data.getMonth() + 1) +
            "/" +
            data.getFullYear() +
            " " +
            FinanzeCore.dueCifre(data.getHours()) +
            ":" +
            FinanzeCore.dueCifre(data.getMinutes())
        );
    },

    parseImporto: function(valore) {
        var s = String(valore || "")
            .trim()
            .replace(/€/g, "")
            .replace(/\s/g, "");

        if (s == "") {
            return null;
        }

        if (
            s.indexOf(",") >= 0 &&
            s.indexOf(".") >= 0
        ) {
            s = s.replace(/\./g, "");
            s = s.replace(",", ".");
        } else if (
            s.indexOf(",") >= 0
        ) {
            s = s.replace(",", ".");
        }

        var n = Number(s);

        return isFinite(n)
            ? n
            : null;
    },

    formattaEuro: function(valore) {
        var n = FinanzeCore.numero(valore);

        var parti = Math.abs(n)
            .toFixed(2)
            .split(".");

        var intero = parti[0]
            .replace(
                /\B(?=(\d{3})+(?!\d))/g,
                "."
            );

        return (
            (n < 0 ? "- " : "") +
            intero +
            "," +
            parti[1] +
            " €"
        );
    },
    relazioni: function(valore) {
        if (!valore) {
            return [];
        }

        if (
            typeof valore.length !=
            "undefined"
        ) {
            return valore;
        }

        return [valore];
    },

    contieneElemento: function(
        collegamenti,
        idElemento
    ) {
        var lista =
            FinanzeCore.relazioni(
                collegamenti
            );

        for (
            var i = 0;
            i < lista.length;
            i++
        ) {
            if (
                lista[i] &&
                lista[i].id ==
                idElemento
            ) {
                return true;
            }
        }

        return false;
    },

    pulisciElementi: function(elenco) {
        var risultato = [];

        if (!elenco) {
            return risultato;
        }

        for (
            var i = 0;
            i < elenco.length;
            i++
        ) {
            if (
                elenco[i] &&
                !elenco[i].deleted
            ) {
                risultato.push(
                    elenco[i]
                );
            }
        }
        return risultato;
    },

    etichettaConto: function(conto) {
        if (!conto) {
            return "Conto";
        }

        var istituto = String(
            conto.field("Istituto") || ""
        ).trim();

        var nome = String(
            conto.field("Nome Conto") || ""
        ).trim();

        if (
            istituto != "" &&
            nome != ""
        ) {
            return (
                istituto +
                " - " +
                nome
            );
        }

        if (istituto != "") {
            return istituto;
        }

        if (nome != "") {
            return nome;
        }

        return "Conto";
    }
};