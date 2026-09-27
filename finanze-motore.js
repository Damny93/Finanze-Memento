// ============================================================
// FINANZE
// MOTORE CENTRALE - RICALCOLO FINANZE
// VERSIONE: 0.8.1 PRO
// ============================================================
//
// LIBRERIA:
// [■] Transazioni
//
// TIPO:
// Condiviso
//
// FUNZIONE PUBBLICA:
// ricalcolaFinanze()
//
// BASE:
// MOTORE TRANSAZIONI v0.3 TEST - VERIFICATO
//
// IMPORTANTE:
// Questo script NON contiene logica di trigger.
// Creazione / Modifica / Eliminazione decidono quando
// richiamare ricalcolaFinanze().
//
// LOGICA 0.8.1:
// - Primo Check = baseline automatica.
// - Check successivi = VERIFICA ENTRATE.
// - Nessuna "Altra Spesa" viene creata finché
//   "Entrate Verificate" non è true.
// - Differenza positiva riapre il Check.
// - Quando un Check viene chiuso in OK, tutte le
//   transazioni dell'intervallo vengono collegate
//   a quel Check in modo idempotente.
//
// ============================================================

function versioneMotoreFinanze() {

    return "0.8.1 PRO";
}


function ricalcolaFinanze(
    libreriaSaldo,
    libreriaTransazioni,
    libreriaConti,
    libreriaDashboard,
    libreriaSpeseFisseDashboard,
    libreriaSalvadanaioDashboard
) {


    // ========================================================
    // 1. LIBRERIE
    // ========================================================
    //
    // Tutte le librerie usate dal motore vengono ricevute
    // direttamente dallo script chiamante Memento.
    //
    // Il file JavaScript esterno NON risolve librerie da solo.
    // Questo evita problemi di contesto su Memento Desktop.
    // ========================================================


    // ========================================================
    // 2. CONTROLLO LIBRERIE
    // ========================================================

    if (
        !libreriaSaldo ||
        !libreriaTransazioni ||
        !libreriaConti ||
        !libreriaDashboard ||
        !libreriaSpeseFisseDashboard ||
        !libreriaSalvadanaioDashboard
    ) {

        message(
            "ERRORE v0.8.0: una o più librerie FINANZE non sono accessibili."
        );

        return;
    }


    // ========================================================
    // 3. DATI GLOBALI
    // ========================================================

    var tuttiCheck =
        libreriaSaldo.entries();

    var tutteTransazioni =
        libreriaTransazioni.entries();

    var tuttiConti =
        libreriaConti.entries();


    // Le nuove riconciliazioni vengono aggiunte anche
    // a tutteTransazioni, perché Memento potrebbe non
    // restituirle immediatamente con entries().

    var riconciliazioniCreate =
        [];


    // ========================================================
    // 4. FUNZIONI COMUNI
    // ========================================================

    function contieneConto(
        collegamenti,
        idConto
    ) {

        if (
            !collegamenti ||
            collegamenti.length == 0
        ) {

            return false;
        }


        for (
            var i = 0;
            i < collegamenti.length;
            i++
        ) {

            if (
                collegamenti[i].id ==
                idConto
            ) {

                return true;
            }
        }


        return false;
    }


    function tempoVoce(
        voce
    ) {

        var data =
            voce.field(
                "Data e Ora"
            );


        if (
            !data
        ) {

            return 0;
        }


        return moment(
            data
        )
        .toDate()
        .getTime();
    }


    function ordinaCronologicamente(
        a,
        b
    ) {

        var tempoA =
            tempoVoce(a);

        var tempoB =
            tempoVoce(b);


        if (
            tempoA < tempoB
        ) {

            return -1;
        }


        if (
            tempoA > tempoB
        ) {

            return 1;
        }


        var idA =
            String(
                a.id || ""
            );

        var idB =
            String(
                b.id || ""
            );


        if (
            idA < idB
        ) {

            return -1;
        }


        if (
            idA > idB
        ) {

            return 1;
        }


        return 0;
    }



    function ordinaMovimentiCronologicamente(
        a,
        b
    ) {

        var tempoA =
            tempoVoce(a);

        var tempoB =
            tempoVoce(b);


        if (
            tempoA < tempoB
        ) {

            return -1;
        }


        if (
            tempoA > tempoB
        ) {

            return 1;
        }


        // A parità di timestamp, la rettifica automatica
        // "Altre Spese" deve essere applicata per ultima.
        // In questo modo un'entrata reale inserita nello stesso
        // minuto del Check viene mostrata prima della rettifica.
        var aRettifica =
            a.field("Origine") ==
                "Calcolata" &&
            a.field("Categoria") ==
                "Altre Spese";

        var bRettifica =
            b.field("Origine") ==
                "Calcolata" &&
            b.field("Categoria") ==
                "Altre Spese";


        if (
            aRettifica &&
            !bRettifica
        ) {

            return 1;
        }


        if (
            !aRettifica &&
            bRettifica
        ) {

            return -1;
        }


        var idA =
            String(
                a.id || ""
            );

        var idB =
            String(
                b.id || ""
            );


        if (
            idA < idB
        ) {

            return -1;
        }


        if (
            idA > idB
        ) {

            return 1;
        }


        return 0;
    }


    function arrotonda2(
        valore
    ) {

        return Math.round(
            Number(valore) * 100
        ) / 100;
    }


    function formattaSaldoProgressivo(
        valore
    ) {

        var numero =
            Number(
                valore
            );


        if (
            !isFinite(numero)
        ) {

            return "";
        }


        var parti =
            Math.abs(numero)
            .toFixed(2)
            .split(".");


        var intero =
            parti[0].replace(
                /\B(?=(\d{3})+(?!\d))/g,
                "."
            );


        var testo =
            intero +
            "," +
            parti[1] +
            " €";


        if (
            numero < 0
        ) {

            return (
                "[ \u26C3 - " +
                testo +
                " ]"
            );
        }


        return (
            "[ \u26C3 " +
            testo +
            " ]"
        );
    }



    function normalizzaCheckRiconciliazione(
        movimento,
        checkCorretto
    ) {

        var collegamenti =
            movimento.field(
                "Check Riconciliazione"
            );


        // Caso già perfetto:
        // una sola relazione, verso il Check corretto.
        if (
            collegamenti &&
            collegamenti.length == 1 &&
            collegamenti[0].id ==
                checkCorretto.id
        ) {

            return;
        }


        // Ogni transazione appartiene a un solo intervallo
        // di riconciliazione. Rimuoviamo quindi eventuali
        // relazioni vecchie, errate o duplicate.
        if (
            collegamenti &&
            collegamenti.length > 0
        ) {

            for (
                var rc = collegamenti.length - 1;
                rc >= 0;
                rc--
            ) {

                movimento.unlink(
                    "Check Riconciliazione",
                    collegamenti[rc]
                );
            }
        }


        movimento.link(
            "Check Riconciliazione",
            checkCorretto
        );
    }


    function collegaMovimentiIntervallo(
        checkPrecedente,
        checkCorrente,
        idConto
    ) {

        var dataPrecedente =
            checkPrecedente.field(
                "Data e Ora"
            );

        var dataCorrente =
            checkCorrente.field(
                "Data e Ora"
            );


        if (
            !dataPrecedente ||
            !dataCorrente
        ) {

            return;
        }


        var momentoPrecedente =
            moment(
                dataPrecedente
            );

        var momentoCorrente =
            moment(
                dataCorrente
            );


        for (
            var cr = 0;
            cr < tutteTransazioni.length;
            cr++
        ) {

            var movimento =
                tutteTransazioni[cr];


            if (
                !contieneConto(
                    movimento.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {

                continue;
            }


            var dataMovimento =
                movimento.field(
                    "Data e Ora"
                );


            if (
                !dataMovimento
            ) {

                continue;
            }


            var momentoMovimento =
                moment(
                    dataMovimento
                );


            // Intervallo contabile:
            // (Check precedente, Check corrente]
            if (
                !momentoMovimento.isAfter(
                    momentoPrecedente
                ) ||
                momentoMovimento.isAfter(
                    momentoCorrente
                )
            ) {

                continue;
            }


            normalizzaCheckRiconciliazione(
                movimento,
                checkCorrente
            );
        }
    }


    // ========================================================
    // 5. CICLO DI RICOSTRUZIONE DI TUTTI I CONTI
    // ========================================================

    for (
        var indiceConto = 0;
        indiceConto < tuttiConti.length;
        indiceConto++
    ) {

        var conto =
            tuttiConti[
                indiceConto
            ];


        var idConto =
            conto.id;


        if (
            idConto == null
        ) {

            continue;
        }


        var collegamentoConto =
            conto;


        // ====================================================
        // 5A. CHECK DEL CONTO
        // ====================================================

        var checkContoOrdinati =
            [];


        for (
            var cc = 0;
            cc < tuttiCheck.length;
            cc++
        ) {

            var checkConto =
                tuttiCheck[cc];


            var collegamentiCheck =
                checkConto.field(
                    "Conto"
                );


            if (
                !contieneConto(
                    collegamentiCheck,
                    idConto
                )
            ) {

                continue;
            }


            if (
                !checkConto.field(
                    "Data e Ora"
                )
            ) {

                continue;
            }


            checkContoOrdinati.push(
                checkConto
            );
        }


        checkContoOrdinati.sort(
            ordinaCronologicamente
        );


        // ====================================================
        // 5B. PRIMO CHECK
        // ====================================================

        if (
            checkContoOrdinati.length > 0
        ) {

            var primoCheck =
                checkContoOrdinati[0];


            // Il primo Check del conto è la baseline.
            // Non esiste un intervallo precedente da verificare.
            primoCheck.set(
                "Entrate Verificate",
                true
            );


            primoCheck.set(
                "Differenza da giustificare",
                0
            );


            primoCheck.set(
                "Stato di Riconciliazione",
                "OK"
            );
        }


        // ====================================================
        // 5C. RICONCILIAZIONE DAL SECONDO CHECK
        // ====================================================

        for (
            var q = 1;
            q < checkContoOrdinati.length;
            q++
        ) {

            var checkPrecedente =
                checkContoOrdinati[
                    q - 1
                ];

            var checkCorrente =
                checkContoOrdinati[q];


            var dataPrecedente =
                checkPrecedente.field(
                    "Data e Ora"
                );

            var dataCorrente =
                checkCorrente.field(
                    "Data e Ora"
                );


            if (
                !dataPrecedente ||
                !dataCorrente
            ) {

                continue;
            }


            var momentoPrecedente =
                moment(
                    dataPrecedente
                );

            var momentoCorrente =
                moment(
                    dataCorrente
                );

            var timestampCorrente =
                momentoCorrente
                .toDate()
                .getTime();


            var saldoPrecedente =
                Number(
                    checkPrecedente.field(
                        "Disponibilità Netta"
                    )
                );

            var saldoCorrente =
                Number(
                    checkCorrente.field(
                        "Disponibilità Netta"
                    )
                );


            if (
                !isFinite(saldoPrecedente) ||
                !isFinite(saldoCorrente)
            ) {

                continue;
            }


            // ================================================
            // 5D. CERCA RICONCILIAZIONE DEL CHECK
            // ================================================

            var riconciliazione =
                null;


            for (
                var r = 0;
                r < tutteTransazioni.length;
                r++
            ) {

                var transazioneR =
                    tutteTransazioni[r];


                if (
                    transazioneR.field(
                        "Origine"
                    ) != "Calcolata" ||
                    transazioneR.field(
                        "Categoria"
                    ) != "Altre Spese"
                ) {

                    continue;
                }


                if (
                    !contieneConto(
                        transazioneR.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var checkOrigineR =
                    transazioneR.field(
                        "Check Riconciliazione"
                    );


                var appartiene =
                    false;


                if (
                    checkOrigineR &&
                    checkOrigineR.length > 0
                ) {

                    for (
                        var ro = 0;
                        ro < checkOrigineR.length;
                        ro++
                    ) {

                        if (
                            checkOrigineR[ro].id ==
                            checkCorrente.id
                        ) {

                            appartiene =
                                true;

                            break;
                        }
                    }
                }


                // ============================================
                // RECUPERO LEGACY
                // ============================================

                if (
                    !appartiene &&
                    (
                        !checkOrigineR ||
                        checkOrigineR.length == 0
                    )
                ) {

                    var dataR =
                        transazioneR.field(
                            "Data e Ora"
                        );


                    if (
                        dataR
                    ) {

                        var timestampR =
                            moment(
                                dataR
                            )
                            .toDate()
                            .getTime();


                        if (
                            timestampR ==
                            timestampCorrente
                        ) {

                            appartiene =
                                true;


                            transazioneR.link(
                                "Check Riconciliazione",
                                checkCorrente
                            );
                        }
                    }
                }


                if (
                    appartiene
                ) {

                    riconciliazione =
                        transazioneR;

                    break;
                }
            }


            // ================================================
            // 5E. MOVIMENTI REALI NELL'INTERVALLO
            // ================================================

            var entrateIntervallo =
                0;

            var usciteIntervallo =
                0;


            for (
                var m = 0;
                m < tutteTransazioni.length;
                m++
            ) {

                var movimento =
                    tutteTransazioni[m];


                var origineMovimento =
                    movimento.field(
                        "Origine"
                    );

                var categoriaMovimento =
                    movimento.field(
                        "Categoria"
                    );


                if (
                    origineMovimento ==
                        "Calcolata" &&
                    categoriaMovimento ==
                        "Altre Spese"
                ) {

                    continue;
                }


                if (
                    !contieneConto(
                        movimento.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var dataMovimento =
                    movimento.field(
                        "Data e Ora"
                    );


                if (
                    !dataMovimento
                ) {

                    continue;
                }


                var momentoMovimento =
                    moment(
                        dataMovimento
                    );


                if (
                    !momentoMovimento.isAfter(
                        momentoPrecedente
                    )
                ) {

                    continue;
                }


                if (
                    momentoMovimento.isAfter(
                        momentoCorrente
                    )
                ) {

                    continue;
                }


                var importoMovimento =
                    Number(
                        movimento.field(
                            "Importo"
                        )
                    );


                if (
                    !isFinite(
                        importoMovimento
                    )
                ) {

                    continue;
                }


                var tipoMovimento =
                    movimento.field(
                        "Tipo"
                    );


                if (
                    tipoMovimento ==
                    "Entrata"
                ) {

                    entrateIntervallo +=
                        importoMovimento;
                }


                else if (
                    tipoMovimento ==
                    "Uscita"
                ) {

                    usciteIntervallo +=
                        importoMovimento;
                }
            }


            entrateIntervallo =
                arrotonda2(
                    entrateIntervallo
                );

            usciteIntervallo =
                arrotonda2(
                    usciteIntervallo
                );


            // ================================================
            // 5F. DIFFERENZA
            // ================================================

            var saldoAtteso =
                arrotonda2(
                    saldoPrecedente +
                    entrateIntervallo -
                    usciteIntervallo
                );


            var differenza =
                arrotonda2(
                    saldoCorrente -
                    saldoAtteso
                );


            // ================================================
            // 5G. BLOCCO DI VERIFICA ENTRATE
            // ================================================
            //
            // Un Check successivo al primo NON viene chiuso
            // automaticamente. Prima deve essere confermato
            // tramite l'Action "Verifica Entrate".
            //
            // Se il Check precedente non è chiuso, anche quello
            // corrente resta bloccato.
            // ================================================

            var precedenteVerificato =
                checkPrecedente.field(
                    "Entrate Verificate"
                ) === true;

            var statoPrecedente =
                checkPrecedente.field(
                    "Stato di Riconciliazione"
                );


            if (
                !precedenteVerificato ||
                statoPrecedente != "OK"
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    false
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "CHECK PRECEDENTE DA CHIUDERE"
                );

                continue;
            }


            var entrateVerificate =
                checkCorrente.field(
                    "Entrate Verificate"
                ) === true;


            if (
                !entrateVerificate
            ) {

                // Qualsiasi riconciliazione precedente viene
                // sospesa finché il Check non viene verificato.
                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );
                }


                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );


                var statoCorrente =
                    checkCorrente.field(
                        "Stato di Riconciliazione"
                    );


                // Se l'utente ha già dichiarato "TUTTE REGISTRATE"
                // ma resta una differenza positiva, manteniamo
                // l'avviso ENTRATE DA REGISTRARE.
                if (
                    differenza > 0 &&
                    statoCorrente ==
                        "ENTRATE DA REGISTRARE"
                ) {

                    checkCorrente.set(
                        "Stato di Riconciliazione",
                        "ENTRATE DA REGISTRARE"
                    );

                } else {

                    checkCorrente.set(
                        "Stato di Riconciliazione",
                        "VERIFICA ENTRATE"
                    );
                }


                continue;
            }


            // ================================================
            // 5H. DIFFERENZA NEGATIVA - CHECK VERIFICATO
            // ================================================

            if (
                differenza < 0
            ) {

                var importoAltreSpese =
                    arrotonda2(
                        Math.abs(
                            differenza
                        )
                    );


                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Transazione",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Descrizione",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Data e Ora",
                        timestampCorrente
                    );

                    riconciliazione.set(
                        "Importo",
                        importoAltreSpese
                    );

                    riconciliazione.set(
                        "Tipo",
                        "Uscita"
                    );

                    riconciliazione.set(
                        "Categoria",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Origine",
                        "Calcolata"
                    );

                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Conto"
                            ),
                            idConto
                        )
                    ) {

                        riconciliazione.link(
                            "Conto",
                            collegamentoConto
                        );
                    }


                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Riconciliazione"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );
                    }
                }


                else {

                    var nuovaRiconciliazione =
                        libreriaTransazioni.create({

                            "Transazione":
                                "Altre Spese",

                            "Descrizione":
                                "Altre Spese",

                            "Data e Ora":
                                timestampCorrente,

                            "Importo":
                                importoAltreSpese,

                            "Tipo":
                                "Uscita",

                            "Categoria":
                                "Altre Spese",

                            "Origine":
                                "Calcolata"

                        });


                    if (
                        nuovaRiconciliazione
                    ) {

                        // Le relazioni vengono collegate DOPO create().
                        // Su Memento Desktop il passaggio delle relazioni
                        // direttamente dentro create() non è affidabile.
                        nuovaRiconciliazione.link(
                            "Conto",
                            collegamentoConto
                        );

                        nuovaRiconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );


                        riconciliazioniCreate.push(
                            nuovaRiconciliazione
                        );

                        tutteTransazioni.push(
                            nuovaRiconciliazione
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    true
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    0
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "OK"
                );
            }


            // ================================================
            // 5I. DIFFERENZA POSITIVA - CHECK DA RIAPRIRE
            // ================================================

            else if (
                differenza > 0
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );

                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Riconciliazione"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );
                    }
                }


                // Una differenza positiva non può essere
                // chiusa come spesa. Il Check torna non verificato.
                checkCorrente.set(
                    "Entrate Verificate",
                    false
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "ENTRATE DA REGISTRARE"
                );
            }


            // ================================================
            // 5J. DIFFERENZA ZERO - CHECK VERIFICATO
            // ================================================

            else {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );

                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Riconciliazione"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    true
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    0
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "OK"
                );
            }


            // ================================================
            // 5K. COLLEGA TUTTI I MOVIMENTI AL CHECK CHIUSO
            // ================================================
            //
            // Solo un Check realmente chiuso (OK + verificato)
            // diventa il contenitore storico dei movimenti
            // dell'intervallo (precedente, corrente].
            //
            // Questo recupera anche movimenti creati prima
            // dell'introduzione di questa logica, ad esempio
            // Spese Fisse già registrate.
            // ================================================

            if (
                checkCorrente.field(
                    "Entrate Verificate"
                ) === true &&
                checkCorrente.field(
                    "Stato di Riconciliazione"
                ) == "OK"
            ) {

                collegaMovimentiIntervallo(
                    checkPrecedente,
                    checkCorrente,
                    idConto
                );
            }
        }


        // ====================================================
        // 6. SALDO PROGRESSIVO DEL CONTO
        // ====================================================

        var saldoIniziale =
            Number(
                conto.field(
                    "Saldo Iniziale"
                )
            );

        var dataSaldoIniziale =
            conto.field(
                "Data Saldo Iniziale"
            );


        var saldoContabileCorrenteConto =
            null;


        if (
            isFinite(
                saldoIniziale
            ) &&
            dataSaldoIniziale
        ) {

            var momentoSaldoIniziale =
                moment(
                    dataSaldoIniziale
                );


            var movimentiProgressivo =
                [];


            for (
                var fp = 0;
                fp < tutteTransazioni.length;
                fp++
            ) {

                var movimentoFiltro =
                    tutteTransazioni[fp];


                if (
                    !contieneConto(
                        movimentoFiltro.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var dataFiltro =
                    movimentoFiltro.field(
                        "Data e Ora"
                    );


                if (
                    !dataFiltro
                ) {

                    continue;
                }


                var momentoFiltro =
                    moment(
                        dataFiltro
                    );


                if (
                    momentoFiltro.isBefore(
                        momentoSaldoIniziale
                    )
                ) {

                    continue;
                }


                var tipoFiltro =
                    movimentoFiltro.field(
                        "Tipo"
                    );

                var categoriaFiltro =
                    movimentoFiltro.field(
                        "Categoria"
                    );


                if (
                    tipoFiltro ==
                        "Bilancio" &&
                    categoriaFiltro ==
                        "Bilancio Iniziale"
                ) {

                    continue;
                }


                movimentiProgressivo.push(
                    movimentoFiltro
                );
            }


            movimentiProgressivo.sort(
                ordinaMovimentiCronologicamente
            );


            var saldoProgressivo =
                arrotonda2(
                    saldoIniziale
                );


            for (
                var p = 0;
                p < movimentiProgressivo.length;
                p++
            ) {

                var movimentoProgressivo =
                    movimentiProgressivo[p];


                var tipoProgressivo =
                    movimentoProgressivo.field(
                        "Tipo"
                    );

                var importoProgressivo =
                    Number(
                        movimentoProgressivo.field(
                            "Importo"
                        )
                    );


                if (
                    !isFinite(
                        importoProgressivo
                    )
                ) {

                    continue;
                }


                if (
                    tipoProgressivo ==
                    "Entrata"
                ) {

                    saldoProgressivo +=
                        importoProgressivo;
                }


                else if (
                    tipoProgressivo ==
                    "Uscita"
                ) {

                    saldoProgressivo -=
                        importoProgressivo;
                }


                else {

                    continue;
                }


                saldoProgressivo =
                    arrotonda2(
                        saldoProgressivo
                    );


                movimentoProgressivo.set(
                    "Saldo Progressivo",
                    saldoProgressivo
                );


                movimentoProgressivo.set(
                    "Saldo Progressivo Visualizzato",
                    formattaSaldoProgressivo(
                        saldoProgressivo
                    )
                );
            }


            // Il saldo progressivo finale rappresenta il saldo
            // contabile corrente del conto, comprese le
            // transazioni successive all'ultimo Check.
            saldoContabileCorrenteConto =
                arrotonda2(
                    saldoProgressivo
                );
        }


        // ====================================================
        // 7. SALDO ATTUALE DEL CONTO = SALDO CONTABILE CORRENTE
        // ====================================================
        //
        // Priorità:
        // 1. Saldo progressivo ricostruito da Saldo Iniziale
        //    + tutte le Transazioni.
        // 2. Fallback: ultimo Check + movimenti successivi.
        // 3. Fallback finale: Saldo Iniziale.
        //
        // In questo modo "Saldo Attuale" non resta fermo
        // all'ultimo Check: rappresenta ciò che il sistema
        // conosce ADESSO.
        // ====================================================

        var saldoCorrenteConto =
            saldoContabileCorrenteConto;


        if (
            !isFinite(
                saldoCorrenteConto
            )
        ) {

            if (
                checkContoOrdinati.length > 0
            ) {

                var ultimoCheckConto =
                    checkContoOrdinati[
                        checkContoOrdinati.length - 1
                    ];

                var saldoUltimoCheck =
                    Number(
                        ultimoCheckConto.field(
                            "Disponibilità Netta"
                        )
                    );

                var dataUltimoCheck =
                    ultimoCheckConto.field(
                        "Data e Ora"
                    );


                if (
                    isFinite(
                        saldoUltimoCheck
                    ) &&
                    dataUltimoCheck
                ) {

                    saldoCorrenteConto =
                        arrotonda2(
                            saldoUltimoCheck
                        );

                    var momentoUltimoCheckConto =
                        moment(
                            dataUltimoCheck
                        );


                    for (
                        var sc = 0;
                        sc < tutteTransazioni.length;
                        sc++
                    ) {

                        var movimentoSuccessivo =
                            tutteTransazioni[sc];


                        if (
                            !contieneConto(
                                movimentoSuccessivo.field(
                                    "Conto"
                                ),
                                idConto
                            )
                        ) {

                            continue;
                        }


                        var dataSuccessiva =
                            movimentoSuccessivo.field(
                                "Data e Ora"
                            );


                        if (
                            !dataSuccessiva ||
                            !moment(
                                dataSuccessiva
                            ).isAfter(
                                momentoUltimoCheckConto
                            )
                        ) {

                            continue;
                        }


                        var tipoSuccessivo =
                            movimentoSuccessivo.field(
                                "Tipo"
                            );

                        var importoSuccessivo =
                            Number(
                                movimentoSuccessivo.field(
                                    "Importo"
                                )
                            );


                        if (
                            !isFinite(
                                importoSuccessivo
                            )
                        ) {

                            continue;
                        }


                        if (
                            tipoSuccessivo ==
                            "Entrata"
                        ) {

                            saldoCorrenteConto +=
                                importoSuccessivo;

                        } else if (
                            tipoSuccessivo ==
                            "Uscita"
                        ) {

                            saldoCorrenteConto -=
                                importoSuccessivo;
                        }


                        saldoCorrenteConto =
                            arrotonda2(
                                saldoCorrenteConto
                            );
                    }
                }
            }
        }


        if (
            !isFinite(
                saldoCorrenteConto
            ) &&
            isFinite(
                saldoIniziale
            )
        ) {

            saldoCorrenteConto =
                arrotonda2(
                    saldoIniziale
                );
        }


        if (
            isFinite(
                saldoCorrenteConto
            )
        ) {

            conto.set(
                "Saldo Attuale",
                saldoCorrenteConto
            );
        }
    }


    // ========================================================
    // 8. STATO CHECK PER LA DASHBOARD
    // ========================================================
    //
    // Il valore numerico di Saldo Attuale è corrente.
    // Lo stato sotto la card descrive invece quanto è affidabile
    // il controllo bancario reale.
    //
    // Con più conti attivi, quando tutti sono OK viene usata
    // la data del Check PIÙ VECCHIO tra gli ultimi Check di ogni
    // conto: così il totale aggregato non sembra più fresco di
    // quanto sia realmente.
    // ========================================================

    var momentoUltimoCheckDashboard =
        null;

    var statoCheckDashboard =
        "OK";

    var prioritaStatoDashboard =
        0;

    var numeroContiAttivi =
        0;

    var numeroContiConCheck =
        0;


    function impostaStatoDashboard(
        stato,
        priorita
    ) {

        if (
            priorita >
            prioritaStatoDashboard
        ) {

            statoCheckDashboard =
                stato;

            prioritaStatoDashboard =
                priorita;
        }
    }


    for (
        var dc = 0;
        dc < tuttiConti.length;
        dc++
    ) {

        var contoCheckDashboard =
            tuttiConti[dc];


        if (
            !contoCheckDashboard.field(
                "Attivo"
            )
        ) {

            continue;
        }


        numeroContiAttivi++;


        var idContoDashboard =
            contoCheckDashboard.id;

        var checkDashboardConto =
            [];


        for (
            var dck = 0;
            dck < tuttiCheck.length;
            dck++
        ) {

            if (
                contieneConto(
                    tuttiCheck[dck].field(
                        "Conto"
                    ),
                    idContoDashboard
                )
            ) {

                checkDashboardConto.push(
                    tuttiCheck[dck]
                );
            }
        }


        checkDashboardConto.sort(
            ordinaCronologicamente
        );


        if (
            checkDashboardConto.length == 0
        ) {

            impostaStatoDashboard(
                "CHECK MANCANTE",
                50
            );

            continue;
        }


        numeroContiConCheck++;


        var ultimoCheckDashboardConto =
            checkDashboardConto[
                checkDashboardConto.length - 1
            ];

        var dataUltimoCheckDashboardConto =
            ultimoCheckDashboardConto.field(
                "Data e Ora"
            );


        if (
            dataUltimoCheckDashboardConto
        ) {

            var momentoCheckConto =
                moment(
                    dataUltimoCheckDashboardConto
                );


            if (
                !momentoUltimoCheckDashboard ||
                momentoCheckConto.isBefore(
                    momentoUltimoCheckDashboard
                )
            ) {

                momentoUltimoCheckDashboard =
                    momentoCheckConto;
            }
        }


        var statoUltimoCheck =
            ultimoCheckDashboardConto.field(
                "Stato di Riconciliazione"
            );

        var entrateVerificateUltimoCheck =
            ultimoCheckDashboardConto.field(
                "Entrate Verificate"
            );


        if (
            statoUltimoCheck ==
            "CHECK PRECEDENTE DA CHIUDERE"
        ) {

            impostaStatoDashboard(
                "CHECK PRECEDENTE DA CHIUDERE",
                40
            );

        } else if (
            statoUltimoCheck ==
            "ENTRATA DA REGISTRARE"
        ) {

            impostaStatoDashboard(
                "ENTRATE DA REGISTRARE",
                30
            );

        } else if (
            statoUltimoCheck ==
            "VERIFICA ENTRATE" ||
            entrateVerificateUltimoCheck !== true
        ) {

            impostaStatoDashboard(
                "VERIFICA ENTRATE",
                20
            );

        } else if (
            statoUltimoCheck !=
            "OK"
        ) {

            impostaStatoDashboard(
                "ERRORE RICONCILIAZIONE",
                35
            );
        }
    }


    if (
        numeroContiAttivi == 0
    ) {

        statoCheckDashboard =
            "NESSUN CONTO ATTIVO";

        prioritaStatoDashboard =
            60;

    } else if (
        numeroContiConCheck == 0
    ) {

        statoCheckDashboard =
            "NESSUN CHECK";

        prioritaStatoDashboard =
            50;
    }


    // ========================================================
    // 9. DASHBOARD 0.8
    // ========================================================

    if (
        libreriaDashboard
    ) {

        var cardsDashboard =
            libreriaDashboard.entries();


        var cardSaldoAttuale = null;
        var cardSaldoDisponibile = null;
        var cardSalvadanaio = null;
        var cardAltreSpeseMese = null;
        var cardSpeseFisseMese = null;
        var cardEntrateUsciteMese = null;


        for (
            var c = 0;
            c < cardsDashboard.length;
            c++
        ) {

            var card =
                cardsDashboard[c];

            var codiceKPI =
                card.field(
                    "Codice KPI"
                );


            if (
                codiceKPI ==
                "SALDO_ATTUALE"
            ) {

                cardSaldoAttuale =
                    card;

            } else if (
                codiceKPI ==
                "SALDO_DISPONIBILE"
            ) {

                cardSaldoDisponibile =
                    card;

            } else if (
                codiceKPI ==
                "SALVADANAIO"
            ) {

                cardSalvadanaio =
                    card;

            } else if (
                codiceKPI ==
                "ALTRE_SPESE_MESE"
            ) {

                cardAltreSpeseMese =
                    card;

            } else if (
                codiceKPI ==
                "SPESE_FISSE_MESE"
            ) {

                cardSpeseFisseMese =
                    card;

            } else if (
                codiceKPI ==
                "ENTRATE_USCITE_MESE"
            ) {

                cardEntrateUsciteMese =
                    card;
            }
        }


        // ====================================================
        // 9A. FORMATO DASHBOARD
        // ====================================================

        function formattaEuroDashboard(
            valore
        ) {

            var numero =
                Number(
                    valore
                );


            if (
                !isFinite(numero)
            ) {

                return "";
            }


            var parti =
                Math.abs(numero)
                .toFixed(2)
                .split(".");


            var intero =
                parti[0].replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    "."
                );


            var risultato =
                intero +
                "," +
                parti[1] +
                " €";


            if (
                numero < 0
            ) {

                risultato =
                    "- " +
                    risultato;
            }


            return risultato;
        }


        function formattaSaldoDashboard(
            valore
        ) {

            return (
                "\u26C3 " +
                formattaEuroDashboard(
                    valore
                )
            );
        }


        function nomeMeseDashboard(
            numeroMese
        ) {

            var mesi = [
                "GENNAIO",
                "FEBBRAIO",
                "MARZO",
                "APRILE",
                "MAGGIO",
                "GIUGNO",
                "LUGLIO",
                "AGOSTO",
                "SETTEMBRE",
                "OTTOBRE",
                "NOVEMBRE",
                "DICEMBRE"
            ];


            return mesi[
                numeroMese
            ];
        }


        function dataNelMeseDashboard(
            data,
            inizio,
            fine
        ) {

            if (
                !data
            ) {

                return false;
            }


            var momento =
                moment(
                    data
                );


            return (
                !momento.isBefore(
                    inizio
                ) &&
                !momento.isAfter(
                    fine
                )
            );
        }


        // ====================================================
        // 9B. PERIODO CORRENTE
        // ====================================================

        var momentoAdessoDashboard =
            moment();

        var inizioMese =
            moment(
                momentoAdessoDashboard
            )
            .startOf(
                "month"
            );

        var fineMese =
            moment(
                momentoAdessoDashboard
            )
            .endOf(
                "month"
            );

        var periodoDashboard =
            nomeMeseDashboard(
                momentoAdessoDashboard.month()
            ) +
            " " +
            momentoAdessoDashboard.year();


        // ====================================================
        // 9C. SALDO ATTUALE COMPLESSIVO = CONTABILE CORRENTE
        // ====================================================

        var saldoAttualeDashboard =
            0;


        for (
            var cd = 0;
            cd < tuttiConti.length;
            cd++
        ) {

            var contoDashboard =
                tuttiConti[cd];


            if (
                !contoDashboard.field(
                    "Attivo"
                )
            ) {

                continue;
            }


            var saldoConto =
                Number(
                    contoDashboard.field(
                        "Saldo Attuale"
                    )
                );


            if (
                isFinite(
                    saldoConto
                )
            ) {

                saldoAttualeDashboard +=
                    saldoConto;
            }
        }


        saldoAttualeDashboard =
            arrotonda2(
                saldoAttualeDashboard
            );


        if (
            cardSaldoAttuale
        ) {

            cardSaldoAttuale.set(
                "Saldo Attuale",
                saldoAttualeDashboard
            );

            cardSaldoAttuale.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    saldoAttualeDashboard
                )
            );

            // Lo stato tecnico del Check resta separato
            // dall'output principale della card.
            //
            // "Valore Secondario" deve rimanere vuoto così
            // non compare più "OK" accanto al Saldo Attuale.
            cardSaldoAttuale.set(
                "Valore Secondario",
                ""
            );

            cardSaldoAttuale.set(
                "Stato Tecnico Check",
                statoCheckDashboard
            );


            if (
                momentoUltimoCheckDashboard
            ) {

                cardSaldoAttuale.set(
                    "Ultimo Check Saldo",
                    momentoUltimoCheckDashboard
                    .toDate()
                    .getTime()
                );
            }
        }


        // ====================================================
        // 9D. SPESE FISSE: REPORT MENSILE + RESIDUO REALE
        // ====================================================
        //
        // Report mensile:
        // usa ancora "Importo Mese [1]" come budget/rateo.
        //
        // Saldo Disponibile:
        // sottrae invece SOLO le rate realmente ancora da
        // sostenere nel mese corrente, usando Prossima Scadenza
        // e Importo Rata. Così una rata già confermata non viene
        // sottratta due volte.
        // ====================================================

        var speseFissePrevisteMese =
            0;

        var speseFisseResidue =
            0;


        if (
            libreriaSpeseFisseDashboard
        ) {

            var elencoSpeseFisse =
                libreriaSpeseFisseDashboard
                .entries();


            for (
                var sf = 0;
                sf < elencoSpeseFisse.length;
                sf++
            ) {

                var spesaFissa =
                    elencoSpeseFisse[sf];

                var importoMensile =
                    Number(
                        spesaFissa.field(
                            "Importo Mese [1]"
                        )
                    );


                if (
                    isFinite(
                        importoMensile
                    )
                ) {

                    speseFissePrevisteMese +=
                        importoMensile;
                }


                var prossimaScadenza =
                    spesaFissa.field(
                        "Prossima Scadenza"
                    ) ||
                    spesaFissa.field(
                        "Prima Scadenza"
                    );

                var importoRata =
                    Number(
                        spesaFissa.field(
                            "Importo Rata"
                        )
                    );


                if (
                    isFinite(
                        importoRata
                    ) &&
                    importoRata > 0 &&
                    dataNelMeseDashboard(
                        prossimaScadenza,
                        inizioMese,
                        fineMese
                    )
                ) {

                    speseFisseResidue +=
                        importoRata;
                }
            }


            speseFissePrevisteMese =
                arrotonda2(
                    speseFissePrevisteMese
                );

            speseFisseResidue =
                arrotonda2(
                    speseFisseResidue
                );
        }


        // ====================================================
        // 9E. SALVADANAI + ACCANTONAMENTI ANCORA PREVISTI
        // ====================================================

        var totaleSalvadanaio =
            0;

        var accantonamentiPrevistiResidui =
            0;


        if (
            libreriaSalvadanaioDashboard
        ) {

            var elencoSalvadanai =
                libreriaSalvadanaioDashboard
                .entries();


            for (
                var sv = 0;
                sv < elencoSalvadanai.length;
                sv++
            ) {

                var salvadanaio =
                    elencoSalvadanai[sv];


                if (
                    !salvadanaio.field(
                        "Attivo"
                    )
                ) {

                    continue;
                }


                var valoreEffettivo =
                    Number(
                        salvadanaio.field(
                            "Importo Effettivo"
                        )
                    );


                if (
                    !isFinite(
                        valoreEffettivo
                    )
                ) {

                    var nominale =
                        Number(
                            salvadanaio.field(
                                "Importo Salvadanaio"
                            )
                        );

                    var anticipato =
                        Number(
                            salvadanaio.field(
                                "Anticipato"
                            )
                        );


                    if (
                        !isFinite(nominale)
                    ) {

                        nominale = 0;
                    }


                    if (
                        !isFinite(anticipato)
                    ) {

                        anticipato = 0;
                    }


                    valoreEffettivo =
                        nominale -
                        anticipato;
                }


                if (
                    valoreEffettivo < 0
                ) {

                    valoreEffettivo = 0;
                }


                totaleSalvadanaio +=
                    valoreEffettivo;


                // --------------------------------------------
                // QUOTA DA ACCANTONARE ANCORA QUESTO MESE
                // --------------------------------------------

                var modalitaSalvadanaio =
                    salvadanaio.field(
                        "Modalità"
                    );


                if (
                    modalitaSalvadanaio !=
                        "Importo a paga" &&
                    modalitaSalvadanaio !=
                        "Percentuale a paga"
                ) {

                    continue;
                }


                var valoreRegolaSalvadanaio =
                    Number(
                        salvadanaio.field(
                            "Valore Regola"
                        )
                    );


                if (
                    !isFinite(
                        valoreRegolaSalvadanaio
                    ) ||
                    valoreRegolaSalvadanaio <= 0
                ) {

                    continue;
                }


                var entrateRiferimento =
                    salvadanaio.field(
                        "Entrata di Riferimento"
                    );


                if (
                    !entrateRiferimento ||
                    entrateRiferimento.length == 0
                ) {

                    continue;
                }


                for (
                    var er = 0;
                    er < entrateRiferimento.length;
                    er++
                ) {

                    var entrataRiferimento =
                        entrateRiferimento[er];

                    var prossimaEntrata =
                        entrataRiferimento.field(
                            "Prossima Entrata"
                        ) ||
                        entrataRiferimento.field(
                            "Prima Entrata"
                        );


                    if (
                        !dataNelMeseDashboard(
                            prossimaEntrata,
                            inizioMese,
                            fineMese
                        )
                    ) {

                        continue;
                    }


                    var quotaPrevista =
                        0;


                    if (
                        modalitaSalvadanaio ==
                        "Importo a paga"
                    ) {

                        quotaPrevista =
                            valoreRegolaSalvadanaio;

                    } else if (
                        modalitaSalvadanaio ==
                        "Percentuale a paga"
                    ) {

                        var importoEntrataPrevisto =
                            Number(
                                entrataRiferimento.field(
                                    "Importo Previsto"
                                )
                            );


                        if (
                            !isFinite(
                                importoEntrataPrevisto
                            ) ||
                            importoEntrataPrevisto <= 0
                        ) {

                            continue;
                        }


                        quotaPrevista =
                            importoEntrataPrevisto *
                            valoreRegolaSalvadanaio /
                            100;
                    }


                    if (
                        isFinite(
                            quotaPrevista
                        ) &&
                        quotaPrevista > 0
                    ) {

                        accantonamentiPrevistiResidui +=
                            quotaPrevista;
                    }
                }
            }


            totaleSalvadanaio =
                arrotonda2(
                    totaleSalvadanaio
                );

            accantonamentiPrevistiResidui =
                arrotonda2(
                    accantonamentiPrevistiResidui
                );
        }


        if (
            cardSalvadanaio
        ) {

            cardSalvadanaio.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    totaleSalvadanaio
                )
            );

            cardSalvadanaio.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 9F. TOTALI TRANSAZIONI DEL MESE FINO AD ADESSO
        // ====================================================
        //
        // Non sono più congelati all'ultimo Check.
        // Il Check certifica il saldo; i report mostrano invece
        // tutto ciò che l'app conosce nel mese corrente.
        // ====================================================

        var altreSpeseMese = 0;
        var speseFisseMese = 0;
        var entrateMese = 0;
        var usciteMese = 0;


        for (
            var x = 0;
            x < tutteTransazioni.length;
            x++
        ) {

            var movimentoKPI =
                tutteTransazioni[x];

            var categoriaKPI =
                movimentoKPI.field(
                    "Categoria"
                );

            var tipoKPI =
                movimentoKPI.field(
                    "Tipo"
                );

            var dataKPI =
                movimentoKPI.field(
                    "Data e Ora"
                );

            var importoKPI =
                Number(
                    movimentoKPI.field(
                        "Importo"
                    )
                );


            if (
                !dataKPI ||
                !isFinite(
                    importoKPI
                )
            ) {

                continue;
            }


            var momentoKPI =
                moment(
                    dataKPI
                );


            if (
                momentoKPI.isBefore(
                    inizioMese
                ) ||
                momentoKPI.isAfter(
                    fineMese
                )
            ) {

                continue;
            }


            if (
                tipoKPI ==
                    "Bilancio" &&
                categoriaKPI ==
                    "Bilancio Iniziale"
            ) {

                continue;
            }


            if (
                tipoKPI ==
                "Entrata"
            ) {

                entrateMese +=
                    importoKPI;

            } else if (
                tipoKPI ==
                "Uscita"
            ) {

                usciteMese +=
                    importoKPI;


                if (
                    categoriaKPI ==
                    "Altre Spese"
                ) {

                    altreSpeseMese +=
                        importoKPI;
                }


                if (
                    categoriaKPI ==
                    "Spesa Fissa"
                ) {

                    speseFisseMese +=
                        importoKPI;
                }
            }
        }


        altreSpeseMese =
            arrotonda2(
                altreSpeseMese
            );

        speseFisseMese =
            arrotonda2(
                speseFisseMese
            );

        entrateMese =
            arrotonda2(
                entrateMese
            );

        usciteMese =
            arrotonda2(
                usciteMese
            );


        // ====================================================
        // 9G. SALDO DISPONIBILE
        // ====================================================
        //
        // Quanto posso ancora spendere:
        //
        // Saldo contabile corrente
        // - Salvadanaio già accantonato
        // - Spese Fisse ancora da sostenere nel mese
        // - Accantonamenti del mese ancora da effettuare
        //
        // Le rate già pagate e gli accantonamenti già creati
        // NON vengono sottratti di nuovo.
        // ====================================================

        var saldoDisponibile =
            arrotonda2(
                saldoAttualeDashboard -
                totaleSalvadanaio -
                speseFisseResidue -
                accantonamentiPrevistiResidui
            );


        if (
            cardSaldoDisponibile
        ) {

            cardSaldoDisponibile.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    saldoDisponibile
                )
            );

            cardSaldoDisponibile.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 9H. ALTRE SPESE
        // ====================================================

        if (
            cardAltreSpeseMese
        ) {

            cardAltreSpeseMese.set(
                "Altre Spese - Mese",
                altreSpeseMese
            );

            cardAltreSpeseMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    altreSpeseMese
                )
            );

            cardAltreSpeseMese.set(
                "Periodo Dashboard",
                periodoDashboard
            );
        }


        // ====================================================
        // 9I. SPESE FISSE
        // ====================================================

        if (
            cardSpeseFisseMese
        ) {

            cardSpeseFisseMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    speseFisseMese
                )
            );

            cardSpeseFisseMese.set(
                "Valore Secondario",
                "/ " +
                formattaEuroDashboard(
                    speseFissePrevisteMese
                )
            );

            cardSpeseFisseMese.set(
                "Periodo Dashboard",
                periodoDashboard
            );
        }


        // ====================================================
        // 9J. ENTRATE / USCITE
        // ====================================================

        if (
            cardEntrateUsciteMese
        ) {

            cardEntrateUsciteMese.set(
                "Valore Entrata",
                formattaEuroDashboard(
                    entrateMese
                )
            );

            cardEntrateUsciteMese.set(
                "Separatore",
                "/"
            );

            cardEntrateUsciteMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    usciteMese
                )
            );

            cardEntrateUsciteMese.set(
                "Periodo Dashboard",
                periodoDashboard
            );

            cardEntrateUsciteMese.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 9K. CONTROLLI DASHBOARD
        // ====================================================

        if (
            !cardSaldoAttuale
        ) {

            message(
                "ATTENZIONE: card SALDO_ATTUALE non trovata."
            );
        }


        if (
            !cardSaldoDisponibile
        ) {

            message(
                "ATTENZIONE: card SALDO_DISPONIBILE non trovata."
            );
        }


        if (
            !cardSalvadanaio
        ) {

            message(
                "ATTENZIONE: card SALVADANAIO non trovata."
            );
        }


        if (
            !cardAltreSpeseMese
        ) {

            message(
                "ATTENZIONE: card ALTRE_SPESE_MESE non trovata."
            );
        }


        if (
            !cardSpeseFisseMese
        ) {

            message(
                "ATTENZIONE: card SPESE_FISSE_MESE non trovata."
            );
        }


        if (
            !cardEntrateUsciteMese
        ) {

            message(
                "ATTENZIONE: card ENTRATE_USCITE_MESE non trovata."
            );
        }
    }


} // fine ricalcolaFinanze()
