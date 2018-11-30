#!/usr/bin/env python
# -*- coding: utf-8 -*-

import csv
import datetime, time
from operator import itemgetter
import json
import re 
import copy


### IMPORT ET PREPARATION DES DONNEES
print('! IMPORT ET PREPARATION !')

annees = ['2016', '2017'] 
niveaux = ['um', 'serv', 'pole', 'autoris']

# import de la base de séjours
print('* Import des séjours')
baseSej = []
with open('RUM.csv', newline = '') as f:
    reader = csv.reader(f, delimiter = ';')
    for row in reader:
        baseSej.append(row)
    del baseSej[0]
print('base : ', len(baseSej))

# mise en forme 
for i in range(0, len(baseSej)) :
    # séparation des codes et des libellés
    baseSej[i][7:] = [baseSej[i][7][0:4],baseSej[i][7][6:]]
    baseSej[i][6:7] = [baseSej[i][6][0:4],baseSej[i][6][6:]]
    baseSej[i][5:6] = [baseSej[i][5][0:4],baseSej[i][5][6:]]
    baseSej[i][2:3] = [baseSej[i][2][0:4],baseSej[i][2][6:]]
    # dates 
    baseSej[i][4] = datetime.datetime.strptime(baseSej[i][4],
    '%d%b%Y:%H:%M:%S')
    baseSej[i][5] = datetime.datetime.strptime(baseSej[i][5],
    '%d%b%Y:%H:%M:%S')
    # modification des lettres dans les codes (SPMF ne prend que des chiffres)
    if 'A' in baseSej[i][6] :
        baseSej[i][6] = re.sub(r'A', r'01', baseSej[i][6])
    elif 'B' in baseSej[i][6] :
        baseSej[i][6] = re.sub(r'B', r'02', baseSej[i][6])
    baseSej[i][6] = baseSej[i][6].zfill(4)
print(baseSej[0:5])
# FORMAT :
# baseSej = [[année, ipp, code UM, libellé UM, date d'entrée,
#   date de sortie, code service, libellé service, code pôle,
#   libellé pôle, code autorisation, libellé autorisation]]

# création de la liste de venues = RUM consécutifs :
# jour de sortie de l'un = jour d'entrée de l'autre pour un même patient (ipp)
lsVenues = {}
v = 0
for i in range(0, len(baseSej)) :
    try :
        if baseSej[i][1] == baseSej[i-1][1] and \
        baseSej[i][4].date() == baseSej[i-1][5].date() and \
        lsVenues != {} :
            baseSej[i].append(baseSej[i-1][12])
            lsVenues[baseSej[i][1]][baseSej[i-1][12]][1] = baseSej[i][5]
        else :
            v+=1
            baseSej[i].append(str(v))
            if baseSej[i][1] in lsVenues.keys() :
                lsVenues[baseSej[i][1]][str(v)] = [baseSej[i][4], 
            baseSej[i][5], False]
            else :
                lsVenues[baseSej[i][1]] = {str(v) : [baseSej[i][4], 
            baseSej[i][5], False]}
    except IndexError:
        print('erreur')
        print(baseSej[i])
print('patients : ', len(lsVenues))
print(v)

# FORMAT :
# lsVenues = {ipp : {venue : [entrée, sortie, booléen chirurgie]}}

# import de la liste d'interventions chir
print('* Import des actes chirurgicaux')
chir = []
with open('blocs.csv', newline = '') as f:
    reader = csv.reader(f,delimiter = ';')
    for row in reader:
        chir.append(row)        
    del chir[0]

# mise en forme
# format identique à baseSej avec codes et libellés fictifs
for i in range(0, len(chir)) :
    chir[i][4] = datetime.datetime.strptime(chir[i][4], '%d%b%y:%H:%M:%S')
    chir[i][5] = datetime.datetime.strptime(chir[i][5], '%d%b%y:%H:%M:%S')

print('actes chir : ', len(chir))

# tri des venues ayant une intervention chir
print('* Sélection des venues')

# modification du booléen chirurgie dans lsVenue si intervention entre
#  les dates d'entrée et sortie de la venue
for i in range(0, len(chir)) :
    for key in lsVenues[chir[i][1]] :
        if chir[i][4].date() >= lsVenues[chir[i][1]].get(key)[0].date() and \
        chir[i][5].date() <= lsVenues[chir[i][1]].get(key)[1].date() :
            chir[i].extend([key,'ok'])
            lsVenues[chir[i][1]][key][2] = True

# vérification
a = 0
i = 0
while i in range(0, len(chir)) :
    if chir[i][-1] != 'ok' :
        a += 1
        print('non placé : ', chir[i][:5], a)
        del(chir[i])
    else :
           i +=1

a = 0
b = 0
for key in lsVenues.keys() :
    for cle in lsVenues[key].keys() :
        a += 1
        if lsVenues[key].get(cle)[-1] :
            b += 1
print('venues : ', a)
print('venues triées : ', b)

# liste des rum triés (+ liste simplifiée pour usage extérieur)
db = []
rum = []
for i in range(0, len(baseSej)) :
    if lsVenues[baseSej[i][1]].get(baseSej[i][12])[-1] :
        db.append(baseSej[i])
        rum.append([baseSej[i][1], baseSej[i][4], baseSej[i][5], baseSej[i][12]])
print('RUM triés 2 : ', len(db))

# FORMAT :
# db = [[année, ipp, code UM, libellé UM, date d'entrée,
#   date de sortie, code service, libellé service, code pôle,
#   libellé pôle, code autorisation, libellé autorisation, venue]]

# ~ # export pour utilisation externe
# ~ with open('db_rum.csv', 'w') as fichier :
    # ~ fichier.write('ipp,entree,sortie,venue\n')
    # ~ for i in range(0, len(rum)) :
        # ~ fichier.write(','.join([rum[i][0], rum[i][1].strftime('%d%b%Y:%H:%M:%S'),
         # ~ rum[i][2].strftime('%d%b%Y:%H:%M:%S'), rum[i][3]]) + '\n')

# concaténation et tri des tables
a = 0
b = 0
for i in range(0, len(chir)) :
    if chir[i][-1] == 'ok' :
        a += 1
        db.append(chir[i][:-1])
    else :
        b += 1
db.sort(key = itemgetter(12, 4))
print('base totale : ', len(db))
print('bloc placé :', a, 'non placé :', b)
    
# correction de l'année en cas de venue à cheval sur le nouvel an 
# avec plusieurs séjours ou si bloc dans l'année précédente à la sortie
for i in range(1, len(db)+1) :
    if db[-i][12] == db[-i+1][12] and db[-i][0] != db[-i+1][0] :
        # ~ print('correction année : ', db[-i][12], db[-i][:4])
        db[-i][0] = db[-i+1][0]


# découpage des séjours à cheval autour de l'intervention
print('* Découpage des séjours à cheval')
i = 0
while i in range(0, len(db)) :
    if db[i][2] == '0000' :
        try :
            # suppression des RUM englobés dans le temps d'intervention
            # à cause de mutations anticipées répétées
            while db[i][12] == db[i+1][12] and db[i][5] > db[i+1][5] and \
             db[i][4] < db[i+1][4] :
                del db[i+1]
            # si sortie 1 > sortie 2 : jour différent ou au moins 4h,
            # ou s'il y a ensuite un bloc à ne pas laisser collé
            if db[i][12] == db[i-1][12] and db[i][5] < db[i-1][5]\
             and (db[i-1][5] - db[i][5] > datetime.timedelta(days = 0, hours = 4) \
             or db[i+1][2] == '0000') :
                # création de doublon de la première ligne de chaque côté
                db[i:i+1] = [db[i][:], db[i-1][:]]
                # correction des dates d'entrée / sortie
                db[i-1][5] = db[i][4]
                db[i+1][4] = db[i][5]
                i += 1
                if db[i][5] - db[i][4] < datetime.timedelta(hours = 0) :
                    print ("/!\ dates : " , db[i])
            
        except IndexError:
            print('index error', db[i])
            pass
    i += 1
print ("base redécoupée : ", len(db))   

# nettoyage 
delta = datetime.timedelta(minutes = 60)
i = 0
while i in range(0, len(db)) :
    # suppression des RUM < delta (1h) sauf s'il s'agit d'un bloc 
    # et sauf s'ils sont encadrés par des blocs à ne pas laisser collés (même patient)
    if (db[i][5] - db[i][4]) < delta and db[i][2] != '0000' and \
     (((db[i-1][2] != '0000' and db[i][12] == db[i-1][12]) or \
     i == 0 or db[i][12] != db[i-1][12]) and \
     ((db[i+1][2] != '0000' and db[i][12] == db[i+1][12]) or \
     i == len(db) or db[i][12] != db[i+1][12])) :
        try :
            # agréagation des lignes si le RUM de chaque côté est dans 
            #  la même UM, pour le même patient
            if db[i-1][2] == db[i+1][2] and db[i-1][12] == db[i+1][12]:
                db[i-1][5] = db[i+1][5]
                del db[i]
        except IndexError :
            print('index error', i)
            pass 
        
        # repérage des rum de moins de 1, 2 ou 3 heures
        # ~ db[i][0] = '1'
    # ~ elif (db[i][5] - db[i][4]) < datetime.timedelta(hours = 2) and db[i][2] != '0000':
        # ~ db[i][0] = '2'
    # ~ elif (db[i][5] - db[i][4]) < datetime.timedelta(hours = 3) and db[i][2] != '0000':
        # ~ db[i][0] = '3'
        del db[i]   
        
    # suppression des séjours hors années ciblées 
    elif db[i][0] not in annees :
        if db[i][12] in lsVenues.keys() :
            del lsVenues[db[i][12]]
        del db[i]
        
    else :
        i += 1
print ("base nettoyée : ", len(db))

# ~ # export de la base totale (utilisation externe)
# ~ with open('db_rum+bloc.csv', 'w') as fichier :
    # ~ fichier.write('venue,code_um,lib_um,code_autoris,lib_autoris,code_serv,lib_serv,code_phu,lib_phu,entree,sortie\n')
    # ~ for i in range(0, len(db)) :
        # ~ fichier.write(','.join([db[i][12], db[i][2], db[i][3], ','.join(db[i][6:12]),
         # ~ db[i][4].strftime('%d/%m/%Y %H:%M:%S'), db[i][5].strftime('%d/%m/%Y %H:%M:%S')]) + '\n')


# liste des libellés
print('* Libellés')

lsLib = {}
for i in range(0, len(niveaux)) :
    lsLib[niveaux[i]] = {}
    for j in range(0, len(annees)) :
        lsLib[niveaux[i]][annees[j]] = {}
    
for i in range(0,len(db)) :
    if db[i][2] not in lsLib['um'][db[i][0]].keys() :
        lsLib['um'][db[i][0]][db[i][2]] = {'lib' : db[i][3]}
    if db[i][8] not in lsLib['serv'][db[i][0]].keys() :
        lsLib['serv'][db[i][0]][db[i][8]] = {'lib' : db[i][9]}
    if db[i][10] not in lsLib['pole'][db[i][0]].keys() :
        lsLib['pole'][db[i][0]][db[i][10]] = {'lib' : db[i][11]}
    if db[i][6] not in lsLib['autoris'][db[i][0]].keys() :
        lsLib['autoris'][db[i][0]][db[i][6]] = {'lib' : db[i][7]}

# FORMAT :
# lsLib = {niveau : {année : { code : {libellé}}}}

# ajout de l'index de couleur
for keys in lsLib.keys() :
    for key in lsLib[keys].keys() :
        i = 0
        for k in lsLib[keys][key].keys() :
            lsLib[keys][key][k]['col'] = i
            i += 1
        lsLib[keys][key]['taille'] = len(lsLib[keys][key])

# FORMAT :
# lsLib = {année : {niveau : { code : {libellé, couleur}}, nombre de codes}}

with open("lsLib.json", "w") as fichier :
    fichier.write(json.dumps(lsLib, indent = "\t", sort_keys = True))


# séparation de la base principale en sous-bases (par année / niveau)
print('* Division de la base')
dbDiv = {}
for i in range(0, len(niveaux)) :
    dbDiv[niveaux[i]] = {}
    for j in range(0, len(annees)) :
        dbDiv[niveaux[i]][annees[j]] = []

for i in range(0, len(db)) :
    dbDiv[niveaux[0]][db[i][0]].append([db[i][12], db[i][2], db[i][3], db[i][4], db[i][5]])
    dbDiv[niveaux[1]][db[i][0]].append([db[i][12], db[i][8], db[i][9], db[i][4], db[i][5]])
    dbDiv[niveaux[2]][db[i][0]].append([db[i][12], db[i][10], db[i][11], db[i][4], db[i][5]])
    dbDiv[niveaux[3]][db[i][0]].append([db[i][12], db[i][6], db[i][7], db[i][4], db[i][5]])

# FORMAT :
# dbDiv = {niveau : {année : [venue, code, libellé, entrée, sortie]}}

# agrégation des mouvements doublons si niveau > um
print('* Agrégation des doublons')

print(niveaux[0], annees[0], 'avant', len(dbDiv[niveaux[0]][annees[0]]))
for niv in niveaux[1:] :
    for year in dbDiv[niv].keys() :
        i = 1
        while i in range(1, len(dbDiv[niv][year])) :
            if dbDiv[niv][year][i][1] == dbDiv[niv][year][i-1][1] and \
            dbDiv[niv][year][i][0] == dbDiv[niv][year][i-1][0] :
                dbDiv[niv][year][i-1][4] = dbDiv[niv][year][i][4]
                del dbDiv[niv][year][i]
            else :
                i += 1
print(niveaux[0], annees[0], 'après', len(dbDiv[niveaux[0]][annees[0]]))
print(dbDiv[niveaux[0]][annees[0]][:5])



### MODULE 1 : Diagramme de Sankey
### 2 versions : centrage sur la première intervention chirurgicale ou
###  agrégation de toutes les interventions

print('')
print("! MODULE 1 !")

# VERSION 1

print('* Codage des positions')
# codage des positions
# position = code (um/service...) + position relative par rapport au bloc

for niv in dbDiv.keys() :
    for year in dbDiv[niv].keys() :
        # 1° ligne
        
        # calcul de la durée moyenne de séjour (DMS) à la place des dates
        dbDiv[niv][year][0][3] = dbDiv[niv][year][0][4] - dbDiv[niv][year][0][3] 
        del dbDiv[niv][year][0][4]
        
        # codage de la position
        if dbDiv[niv][year][0][1] == '0000' :
            dbDiv[niv][year][0].append('0000+0')
        else :
            dbDiv[niv][year][0].append('pre')
        
        # parcours des lignes à l'endroit
        bloc = False
        for j in range(1, len(dbDiv[niv][year])) :
            
            # calcul de la durée de séjour à la place des dates
            dbDiv[niv][year][j][3] = dbDiv[niv][year][j][4] - dbDiv[niv][year][j][3] # durée du séjour
            del dbDiv[niv][year][j][4]
            
            # codage de la position
            if dbDiv[niv][year][j][0] == dbDiv[niv][year][j-1][0] : # même venue
                if dbDiv[niv][year][j][1] == '0000' and not bloc : # premier bloc
                    bloc = True
                    dbDiv[niv][year][j].append('0000+0')
                elif not bloc : # RUM avant un bloc
                    dbDiv[niv][year][j].append('pre')
                else : # RUM après un bloc
                    dbDiv[niv][year][j].append(dbDiv[niv][year][j][1] + '+' + 
                    str(int(dbDiv[niv][year][j-1][-1][len(dbDiv[niv][year][j-1][1]) + 1 : ]) + 1))
            else : # venue suivante
                bloc = False
                if dbDiv[niv][year][j][1] == '0000' :
                    bloc = True
                    dbDiv[niv][year][j].append('0000+0')
                else :
                    dbDiv[niv][year][j].append('pre')
            
        # parcours à l'envers pour les positions négatives avant le bloc
        for j in range(1, len(dbDiv[niv][year])+1) :
            try :
                if dbDiv[niv][year][-j][0] == dbDiv[niv][year][-j+1][0] \
                and dbDiv[niv][year][-j][-1] == 'pre':
                    dbDiv[niv][year][-j][-1] = dbDiv[niv][year][-j][1] + '-' + \
                     str(int(dbDiv[niv][year][-j+1][-1][len(dbDiv[niv][year][-j+1][1]) + 1 :]) + 1)
            except IndexError :
                print(j, 'en dehors')
                pass

# FORMAT :
# dbDiv = {niveau : {année : [venue, code, libellé, durée moyenne de séjour (DMS), position]}}

print(dbDiv['um']['2016'][:4])

# effectif par positions
print('* Calcul des effectifs')

lsPosition = {}
dictNodes = {}
dictLinks = {}
distMax = {}

for i in range(0, len(niveaux)) :
    lsPosition[niveaux[i]] = {}
    dictNodes[niveaux[i]] = {}
    dictLinks[niveaux[i]] = {}
    distMax[niveaux[i]] = {}
    for j in range(0, len(annees)) :
        lsPosition[niveaux[i]][annees[j]] = {}
        dictNodes[niveaux[i]][annees[j]] = {}
        dictLinks[niveaux[i]][annees[j]] = []
        distMax[niveaux[i]][annees[j]] = {}

def effectif(dbDiv, lsPosition, dictNodes, distMax) :
    for niv in dbDiv.keys() :
        for year in dbDiv[niv].keys() :
            
            # calcul de l'effectif par position
            for j in range(1, len(dbDiv[niv][year])) :
                if dbDiv[niv][year][j][4] in lsPosition[niv][year].keys() :
                    lsPosition[niv][year][dbDiv[niv][year][j][4]][2] += dbDiv[niv][year][j][3] # durée cumulée
                    lsPosition[niv][year][dbDiv[niv][year][j][4]][3] += 1 # effectif
                else : 
                    lsPosition[niv][year][dbDiv[niv][year][j][4]] = [dbDiv[niv][year][j][1],
                     dbDiv[niv][year][j][2], dbDiv[niv][year][j][3], 1]
            
            # calcul de la durée moyenne de séjour par position
            # attribution de l'indice de largeur en fonction de cette durée
            for key in lsPosition[niv][year].keys() :
                dms = lsPosition[niv][year][key][2]/lsPosition[niv][year][key][-1]
                heure = round(dms.seconds / 3600)
                jour = dms.days
                if heure == 24 :
                    jour += 1
                    heure = 0
                dms = str(jour) + 'j ' + str(heure) + 'h'
                lsPosition[niv][year][key][2] = dms
                # indice de largeur par classes
                if jour < 1 :
                    lsPosition[niv][year][key].append(1)
                elif jour < 3 :
                    lsPosition[niv][year][key].append(1.2)
                elif jour < 7 :
                    lsPosition[niv][year][key].append(1.4)
                else :
                    lsPosition[niv][year][key].append(1.6)
                # indice de largeur directement proportionnel
                #lsPosition[niv][year][key].append(round(lsPosition[niv][year][key][-1]/total*100, 1)) 
                
        # FORMAT :
        # lsPosition = {niveau : {année : {position : [code, libellé, 
        #  durée moyenne de séjour, effectif, indice largeur d'effectif]}}}

        # remplissage du dictNodes pour le json + calcul de la proportion 
        #  par distance (paramétrage de précision dans l'interface)
        # (distance = indice de position par rapport au premier bloc)
        for year in lsPosition[niv].keys() : 
            
            # effectif total par distance 
            for key, value in lsPosition[niv][year].items() :
                if key[len(value[0]):] in distMax[niv][year].keys() :
                    distMax[niv][year][key[len(value[0]):]] += value[3]
                else : 
                    distMax[niv][year][key[len(value[0]):]] = value[3]
            
            # FORMAT :
            # distMax = {niveau : {année : {distance : effectif cumulé}}}
            
            # création de la liste de noeuds
            for key, value in lsPosition[niv][year].items() :
                if key[len(value[0]):] in dictNodes[niv][year].keys() and \
                value[0] not in dictNodes[niv][year][key[len(value[0]):]].keys() :
                    dictNodes[niv][year][key[len(value[0]):]][value[0]] = {'libelle' : value[1], \
                     'dms' : value[2], 'value' : value[3], 'effectif' : value[3], \
                     'prop' : round(value[3] / distMax[niv][year].get(key[len(value[0]):]) * 100, 1), \
                     'id' : key, 'group' : value[0], 'coef' : value[4]}
                else :
                    dictNodes[niv][year][key[len(value[0]):]] = {value[0] : {'libelle' : value[1], \
                     'dms' : value[2], 'value' : value[3], 'effectif' : value[3], \
                     'prop' : round(value[3] / distMax[niv][year].get(key[len(value[0]):]) * 100, 1), \
                     'id' : key, 'group' : value[0], 'coef' : value[4]}}
                if value[0] == '0000' :
                    dictNodes[niv][year][key[len(value[0]):]]['0000']['group'] = 'Bloc CTCV'

effectif(dbDiv, lsPosition, dictNodes, distMax)

# FORMAT :
# - lsPosition = {niveau : {année : {position : [code, libellé, 
#    durée moyenne de séjour, effectif, indice largeur d'effectif]}}}
# - distMax = {niveau : {année : {distance : effectif cumulé}}}
# - dictNodes = {niveau : {année : {distance : {code : {libellé,
#    DMS, effectif (calculs), effectif (étiquette), proportion de l'effectif total,
#    position, code (groupe), indice largeur d'effectif}}}}}


# liste des mutations
mut = {}

def mutation(dbDiv, mut) :
    for niv in dbDiv.keys() :
        for year in dbDiv[niv].keys() :
            for j in range(0, len(dbDiv[niv][year])-1) :
                if dbDiv[niv][year][j][0] == dbDiv[niv][year][j+1][0] :
                    if (niv, year, dbDiv[niv][year][j][4], dbDiv[niv][year][j+1][4]) in mut.keys() :
                        mut[(niv, year, dbDiv[niv][year][j][4], dbDiv[niv][year][j+1][4])] += 1
                    else :
                        mut[(niv, year, dbDiv[niv][year][j][4], dbDiv[niv][year][j+1][4])] = 1

mutation(dbDiv, mut)

# FORMAT :
# mut = {(niveau, année, position1, position2) : effectif}

for key, value in mut.items() :
    dictLinks[key[0]][key[1]].append({'source' : key[2],
     'target' : key[3], 'value' : value})

# FORMAT :
# dictLinks = {niveau : {année : [position1 (source), position2 (cible), effectif]}}

print('links', niveaux[0], annees[0], len(dictLinks[niveaux[0]][annees[0]]))

# VERSION 2
print('* VERSION 2')

# codage des positions
print('* Codage des positions bis')

dbDivBis = copy.deepcopy(dbDiv)

for niv in dbDivBis.keys() :
    for year in dbDivBis[niv].keys() :
        
        # 1° ligne
        if dbDivBis[niv][year][0][1] == '0000' :
            dbDivBis[niv][year][0][-1] = '0000+0'
        else :
            dbDivBis[niv][year][0][-1] = 'pre'
            
        # parcours des lignes à l'endroit
        bloc = False
        j = 1
        for j in range(1, len(dbDivBis[niv][year])) :
            if dbDivBis[niv][year][j][0] == dbDivBis[niv][year][j-1][0] : # même venue
                if dbDivBis[niv][year][j][1] == '0000' and not bloc :
                    bloc = True
                    dbDivBis[niv][year][j][-1] = '0000+0'
                    a = 1
                # création d'un doublon en cas de réintervention : 
                #  noeud "réintervention" et noeud "bloc" pour faire le cumul ensuite
                elif dbDivBis[niv][year][j][1] == '0000' and bloc :
                    dbDivBis[niv][year][j:j+1] = [dbDivBis[niv][year][j][:]] + \
                     [dbDivBis[niv][year][j][:]]
                    dbDivBis[niv][year][j+1][-1] = '0000+0'
                    dbDivBis[niv][year][j][-1] = '2000+' + str(a)
                    dbDivBis[niv][year][j][2] = 'Réintervention'
                    j += 1
                    a = 1
                elif not bloc :
                    dbDivBis[niv][year][j][-1] = 'pre'
                else :
                    dbDivBis[niv][year][j][-1] = dbDivBis[niv][year][j][1] + '+' + str(a)
                    a += 1
            else : # venue suivante
                bloc = False
                a = 1
                if dbDivBis[niv][year][j][1] == '0000' :
                    bloc = True
                    dbDivBis[niv][year][j][-1] = '0000+0'
                else :
                    dbDivBis[niv][year][j][-1] = 'pre'
            j += 1
            
        # parcours à l'envers pour les positions négatives avant le bloc
        for j in range(2, len(dbDivBis[niv][year])) :
            try :
                if dbDivBis[niv][year][-j][0] == dbDivBis[niv][year][-j+1][0] \
                and dbDivBis[niv][year][-j][-1] == 'pre':
                    dbDivBis[niv][year][-j][-1] = dbDivBis[niv][year][-j][1] + '-' +\
                     str(int(dbDivBis[niv][year][-j+1][-1][len(dbDivBis[niv][year][-j+1][1]) + 1 : ]) + 1)
            except IndexError :
                print(j, 'en dehors')
                pass

# FORMAT :
# dbDivBis = {niveau : {année : [venue, code, libellé, DMS, position bis]}}

# effectif par positions
print('* Calcul des effectifs bis')
lsPositionBis = {}
dictNodesBis = {}
dictLinksBis = {}
distMaxBis = {}

for i in range(0, len(niveaux)) :
    lsPositionBis[niveaux[i]] = {}
    dictNodesBis[niveaux[i]] = {}
    dictLinksBis[niveaux[i]] = {}
    distMaxBis[niveaux[i]] = {}
    for j in range(0, len(annees)) :
        lsPositionBis[niveaux[i]][annees[j]] = {}
        dictNodesBis[niveaux[i]][annees[j]] = {}
        dictLinksBis[niveaux[i]][annees[j]] = []
        distMaxBis[niveaux[i]][annees[j]] = {}

effectif(dbDivBis, lsPositionBis, dictNodesBis, distMaxBis)

#liste des mutations
mutBis = {}

mutation(dbDivBis, mutBis)

for key, value in mutBis.items() :
    dictLinksBis[key[0]][key[1]].append({'source' : key[2],
     'target' : key[3], 'value' : value})

print('links bis', niveaux[0], annees[0], len(dictLinksBis[niveaux[0]][annees[0]]))

# export
print("* exports")

with open('links.json', 'w') as fichier :
    fichier.write(json.dumps(dictLinks, indent=1))
with open('nodes.json', 'w') as fichier :
    fichier.write(json.dumps(dictNodes, indent=1))
with open('linksBis.json', 'w') as fichier :
    fichier.write(json.dumps(dictLinksBis, indent=1))
with open('nodesBis.json', 'w') as fichier :
    fichier.write(json.dumps(dictNodesBis,indent=1))




### MODULE 2 : extraction de motifs
### (exports de bases adaptées pour l'utilisation du plugin java SPMF et
###  pour le retraitement après, voir le script "script2.py")

print('')
print("! MODULE 2 !")


# préparation de la base pour SPMF (indépendent)
print('* Calcul des séquences')

for niv in dbDiv.keys() :
    for year in dbDiv[niv].keys() :
        sqc = [['8888/', '0j0/', ['<0> 8888']]] # indice d'entrée, DMS nulle
        n = 1 # indice de rang de l'item
        for j in range(0, len(dbDiv[niv][year])-1) : 
            t = dbDiv[niv][year][j][3] # duree de séjour
            
            # dernière séquence
            if j == len(dbDiv[niv][year])-2 :
                tbis = dbDiv[niv][year][j+1][3]
                sqc[-1][1] += str(t.days) + 'j' + str(round(t.seconds / 60)) + \
                 '/' + str(tbis.days) + 'j' + str(round(tbis.seconds / 60))   + '/0j0'
                if dbDiv[niv][year][j][1] == '0000': 
                    sqc[-1][2].extend(['<' + str(n) + '> 1000 <' + \
                     str(n+1) + '> ' + dbDiv[niv][year][j+1][1], '<' + str(n+2) + '> '])
                    sqc[-1][0] += '1000/'
                else :
                    sqc[-1][2].extend(['<' + str(n) + '> ' + dbDiv[niv][year][j][1],
                     '<' + str(n+1) + '> ' + dbDiv[niv][year][j+1][1], '<' + str(n+2) + '> 9999'])
                    sqc[-1][0] += dbDiv[niv][year][j][1] + '/'
                if dbDiv[niv][year][j+1][1] == '0000':
                    sqc[-1][0] += '1000/9999'
                else :
                    sqc[-1][0] += dbDiv[niv][year][j+1][1]  + '/9999' # indice de sortie
            
            # corps de la séquence
            elif dbDiv[niv][year][j][0] == dbDiv[niv][year][j+1][0] : 
                # ajout d'un item "durée"
                sqc[-1][1] += str(t.days) + 'j' + str(round(t.seconds / 60)) + '/'
                # ajout d'un item "code"
                if dbDiv[niv][year][j][1] == '0000': # bloc (modification du code pour SPMF qui ne supporte pas 0000)
                    # format "/"
                    sqc[-1][0] += '1000/'
                    # format SPMF
                    sqc[-1][2].append('<' + str(n) + '> 1000')
                else :
                    sqc[-1][0] += dbDiv[niv][year][j][1] + '/'
                    sqc[-1][2].append('<' + str(n) + '> ' + dbDiv[niv][year][j][1])
                n += 1
            
            # fin de la séquence => nouvelle séquence
            else : 
                sqc[-1][1] += str(t.days) + 'j' + str(round(t.seconds / 60)) + '/0j0'
                if dbDiv[niv][year][j][1] == '0000':
                    sqc[-1][2].extend(['<' + str(n) + '> 1000', '<' + str(n+1) + '> 9999'])
                    sqc[-1][0] += '1000/9999'
                else :
                    sqc[-1][2].extend(['<' + str(n) + '> ' + dbDiv[niv][year][j][1], '<' + str(n+1) + '> 9999'])
                    sqc[-1][0] += dbDiv[niv][year][j][1] + '/9999'
                sqc.append(['8888/', '0j0/', ['<0> 8888']])
                n = 1
        
        print('* exports', niv, year)
        with open('sqc-'+niv+year, 'w') as fichier :
            # format SPMF, séquence des codes
            for s in sqc :
                fichier.write(' -1 '.join(s[2])+' -1 -2\n')
        with open('sqc-'+niv+year+'duree', 'w') as fichier :
            # format "/", séquence des codes et des DMS
            for s in sqc :
                fichier.write(s[0] + ';' + s[1] + '\n')


# FORMAT :
# sqc = [[suite des codes séparés par '/', suite des DMS séparées par '/',
#  suite des codes au format SPMF : séparation des items par -1 <x> et des séquences par -1 -2]]




### MODULE 3 : Graphique en aires empilées
print('')
print("! MODULE 3 !")

# liste des codes
print('* Codes')
lsCodes = {}

for niv in dbDiv.keys() :
    lsCodes[niv] = {}
    for year in dbDiv[niv].keys() :
        lsCodes[niv][year] = {}
        for i in range(0, len(dbDiv[niv][year])) :
            if dbDiv[niv][year][i][1] not in lsCodes[niv][year].keys() :
                lsCodes[niv][year][dbDiv[niv][year][i][1]] = [dbDiv[niv][year][i][0]]
            elif dbDiv[niv][year][i][0] not in lsCodes[niv][year][dbDiv[niv][year][i][1]] :
                lsCodes[niv][year][dbDiv[niv][year][i][1]].append(dbDiv[niv][year][i][0])

# FORMAT :
# lsCodes = {niveau : {année : {code : [venues]}}}

# ~ # structures des um (usage extérieur)
# ~ struc = {}
# ~ for year in annees :
    # ~ for code in lsCodes['um'][year] :
        # ~ if code not in struc.keys() :
            # ~ struc[code] = {'lib' : '', niveaux[1] : [], niveaux[2] : [], niveaux[3] : []}
# ~ for i in range(0, len(db)) : 
    # ~ if struc[db[i][2]].get('serv') == [] :
        # ~ struc[db[i][2]]['lib'] = db[i][3]
        # ~ struc[db[i][2]][niveaux[1]] = [db[i][8], db[i][9]]
        # ~ struc[db[i][2]][niveaux[2]] = [db[i][10], db[i][11]]
        # ~ struc[db[i][2]][niveaux[3]] = [db[i][6], db[i][7]]

# ~ # FORMAT :
# ~ # struc = {code UM : {libellé, [code service, libellé service],
# ~ # [code pôle, libellé pôle], [code autorisation, libellé autorisation]}}

# ~ with open('structure.csv', 'w') as fichier :
    # ~ fichier.write('code_um;lib_um;code_serv;lib_serv;code_pole;lib_pole;code_autoris;lib_autoris\n')
    # ~ for um in struc :
        # ~ fichier.write(';'.join([um, struc[um]['lib'], struc[um]['serv'][0],
         # ~ struc[um]['serv'][1], struc[um]['pole'][0], struc[um]['pole'][1],
         # ~ struc[um]['autoris'][0], struc[um]['autoris'][1]]) + '\n')
    

# agrégation des codes peu fréquents (<x% des venues) dans le code "autre"
print('* Agregation')
for niv in lsCodes.keys() :
    seuil = 0
    for year in lsCodes[niv].keys() :
        for ls in lsCodes[niv][year].values() :
            if len(ls) > seuil :
                seuil = len(ls)
        seuil *= 0.05   # seuil à 5% des venues
        i = 1
        for code, ls in lsCodes[niv][year].items() : 
            if len(ls) < seuil :
                lsCodes[niv][year][code] = False
            elif code != '0000' :
                lsCodes[niv][year][code] = i
                i += 1
        lsCodes[niv][year]['0000'] = 0
        lsCodes[niv][year]['autre'] = i
        lsCodes[niv][year]['table'] = []
        if niv == niveaux[0] :
            print("seuil", year, seuil)

# FORMAT :
# lsCodes = {niveau : {année : {code : booléen d'agrégation (F) ou indice de colonne}}}

# création de la base agrégée à partir de la base de codes
for niv in dbDiv.keys() :
    for year in dbDiv[niv].keys() :
        libelle = [[0, '0000']]
        for code in lsCodes[niv][year].keys() :
            if lsCodes[niv][year][code] and code != 'table'  :
                libelle.append([lsCodes[niv][year].get(code), str(code)])
        iAutre = libelle[-1][0]
        libelle.sort
        print(niv, year, iAutre, "libelles")
        
        for i in range(0, len(dbDiv[niv][year])) : 
            # mesure de la durée de séjour :
            if i == 0 or dbDiv[niv][year][i][0] != dbDiv[niv][year][i-1][0]: # première ligne ou nouvelle venue
                h = 1 # indice d'heure, démarrage à 1 pour exploitation extérieur dans R
                d = 0 # indice de jour, démarrage à 0 pour javascript
            dbDiv[niv][year][i].append(h) # indice de l'heure de début
            dbDiv[niv][year][i].append(d) # indice du jour de début
            h += dbDiv[niv][year][i][3].days * 24 + dbDiv[niv][year][i][3].seconds / 3600  # durée du RUM en heures
            if dbDiv[niv][year][i][3].days < 1 : # durée du RUM en jours
                d += 1
            elif dbDiv[niv][year][i][3].seconds / 3600 > 12 :
                d += dbDiv[niv][year][i][3].days + 1
            else :
                d += dbDiv[niv][year][i][3].days

            dbDiv[niv][year][i].append(h) # indice de l'heure de fin
            dbDiv[niv][year][i].append(d) # indice du jour de fin

            # remplissage de la base de code
            if dbDiv[niv][year][i][8]> len(lsCodes[niv][year]['table']) : # ajout de nouvelles lignes vides
                while dbDiv[niv][year][i][8] > len(lsCodes[niv][year]['table']) :
                    lsCodes[niv][year]['table'].append({}) 
                    for lib in libelle :
                        lsCodes[niv][year]['table'][-1][lib[0]] = 0 # { indice : n}
            
            for j in range(dbDiv[niv][year][i][6], dbDiv[niv][year][i][8]) :
                indice = lsCodes[niv][year].get(dbDiv[niv][year][i][1])
                if lsCodes[niv][year][dbDiv[niv][year][i][1]] or dbDiv[niv][year][i][1] == '0000' : # code non regroupé dans 'autre' ou bloc (indice 0)
                        lsCodes[niv][year]['table'][j][indice] += 1
                else :
                    lsCodes[niv][year]['table'][j][iAutre] += 1
            
        print('export', niv, year)
        with open('area_' + niv + year + '.csv', 'w') as fichier :
            j=0
            fichier.write('jour,')
            for i in range(0, len(libelle)) :
                libelle[i] = libelle[i][1]
            fichier.write(','.join(libelle) + '\n')
            # info sur les 90 premiers jours d'hospit
            if len(lsCodes[niv][year]['table']) < 91 :
                l = len(lsCodes[niv][year]['table'])
            else :
                l = 91
            for i in range(0, l) : 
                fichier.write(str(j) + ',')
                for lib in range(0, len(libelle) - 1) :
                    fichier.write(str(lsCodes[niv][year]['table'][i][lib]) + ',')
                fichier.write(str(lsCodes[niv][year]['table'][i][len(libelle)-1]) + '\n')
                j += 1

# FORMAT :
# dbDiv = {niveau : {année : [venue, code, libellé, DMS, position, H début, j début, H fin, j fin]}}


# ~ # export de la base UM agrégée (utilisation externe) 
# ~ with open('db_um.csv', 'w') as fichier :
    # ~ fichier.write('venue,code_um,lib_um,debut,fin\n')
    # ~ for i in range(0, len(dbDiv['um']['2016'])) :
        # ~ if lsCodes['um']['2016'][dbDiv['um']['2016'][i][1]] or dbDiv['um']['2016'][i][1] == '0000' :
            # ~ fichier.write(','.join([','.join(dbDiv['um']['2016'][i][0:3]),
              # ~ '%.2f' %(dbDiv['um']['2016'][i][5]),  '%.2f' %(dbDiv['um']['2016'][i][7])])+ '\n')
        # ~ else :
            # ~ fichier.write(','.join([dbDiv['um']['2016'][i][0], 'autre', 'autre',
              # ~ '%.2f' %(dbDiv['um']['2016'][i][5]),  '%.2f' %(dbDiv['um']['2016'][i][7])])+ '\n')
    # ~ for i in range(0, len(dbDiv['um']['2017'])) :
        # ~ if lsCodes['um']['2017'][dbDiv['um']['2017'][i][1]] or dbDiv['um']['2017'][i][1] == '0000' :
            # ~ fichier.write(','.join([','.join(dbDiv['um']['2017'][i][0:3]),
              # ~ '%.2f' %(dbDiv['um']['2017'][i][5]),  '%.2f' %(dbDiv['um']['2017'][i][7])])+ '\n')
        # ~ else :
            # ~ fichier.write(','.join([dbDiv['um']['2017'][i][0], 'autre', 'autre',
              # ~ '%.2f' %(dbDiv['um']['2017'][i][5]),  '%.2f' %(dbDiv['um']['2017'][i][7])])+ '\n')

# ~ # export base UM sans les regroupements en code "autre" (utilisation externe) 
# ~ with open('db_um_large.csv', 'w') as fichier :
    # ~ fichier.write('venue,code_um,lib_um,debut,fin\n')
    # ~ for i in range(0, len(dbDiv['um']['2016'])) :
        # ~ fichier.write(','.join([','.join(dbDiv['um']['2016'][i][0:3]),
          # ~ '%.2f' %(dbDiv['um']['2016'][i][5]),  '%.2f' %(dbDiv['um']['2016'][i][7])])+ '\n')
    # ~ for i in range(0, len(dbDiv['um']['2017'])) :
        # ~ fichier.write(','.join([','.join(dbDiv['um']['2017'][i][0:3]),
          # ~ '%.2f' %(dbDiv['um']['2017'][i][5]),  '%.2f' %(dbDiv['um']['2017'][i][7])])+ '\n')


print("temps d'exécution :", time.process_time())
