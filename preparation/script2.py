#!/usr/bin/env python
# -*- coding: utf-8 -*-
from operator import itemgetter
import datetime, time
import json
import copy

annee = ['2016', '2017'] 
niveaux = ['um', 'serv', 'pole', 'autoris']

# import de la liste de libellés
with open("lsLib.json", "r") as fichier :
    label = json.load(fichier)

def analyse(an, niv) :
    print(an, niv)
    
    # import de tous les motifs
    sqc = []
    with open('spm-'+niv+an, 'r', newline='') as f :
        for line in f :
            s = line.split(' -1 ')
            for j in range(0, len(s)-1) :
                s[j] = s[j].split(' ')[1].zfill(4)
            sqc.append(s)
    print(sqc[0:4])
    lsSqc = []
    for i in range(0, len(sqc)) :
        lsSqc.append([sqc[i][:-1], '/'.join(sqc[i][:-1]), int(sqc[i][-1][7:-2])])
    print(lsSqc[0:4])
    
    # FORMAT :
    # lsSqc = [[code1, code2, ...], séquence (sep = '/'), support ( = effectif en séjours)]

    print('total :', len(lsSqc))
    # ~ print(lsSqc[-1])

    # calcul de l'effectif total
    # ajout de l'indicateurs de présence du bloc 
    maxi = 0.0
    for i in range(0, len(lsSqc)) :
        if len(lsSqc[i][0]) == 1 :
            if lsSqc[i][2] > maxi :
                maxi = float(lsSqc[i][2])
        bloc = False
        for j in range(0, len(lsSqc[i][0])) :
            if lsSqc[i][0][j] == '1000':
                lsSqc[i][0][j] = 'Bloc CTCV'
                bloc = True
        lsSqc[i].append(bloc)
    # ~ print('tri :', len(lsSqc))

    # calcul de la proportion de l'effectif 
    print('prop')
    print(lsSqc[0:4])
    for i in range(0, len(lsSqc)) :
        lsSqc[i].append(str(round(float(lsSqc[i][2]) / maxi * 100, 1)) + '%')
    
    # FORMAT :
    # lsSqc = [[code1, code2, ...], séquence (sep = '/'), support (= effectif en séjours),
    #  booléen bloc, proportion de l'effectif]
 
    # tri par ordre de proportion décroissante
    lsSqc.sort(key = itemgetter(2), reverse = True)
    print(lsSqc[0:4])
    
    # mise au format objet et préparation du calcul de la durée de séjour
    objSqc = {}
    for i in range(0, len(lsSqc)) :
        objSqc[lsSqc[i][1]] = {'liste' : [], 'sqc' : lsSqc[i][1],
         'n' : str(lsSqc[i][2]), 'occ' : 0, 'prop' : lsSqc[i][4], 'bloc' : lsSqc[i][3] }
        for j in range(0, len(lsSqc[i][0])) :
            if lsSqc[i][0][j] == '9999' :
                objSqc[lsSqc[i][1]]['liste'].append(['9999', datetime.timedelta(), 'Sortie'])
            elif lsSqc[i][0][j] == '8888' :
                objSqc[lsSqc[i][1]]['liste'].append(['8888', datetime.timedelta(), 'Entree'])
            else :
                objSqc[lsSqc[i][1]]['liste'].append([lsSqc[i][0][j], datetime.timedelta()])
    # ~ print('objSqc', len(objSqc))
    
    # FORMAT : 
    # objSqc = {séquence : {'liste' : [[code, durée de séjour (nul)]],
    #  séquence (sep = '/'), support (= effectif en séjours),
    #  occurences (= nombre d'apparitions, nul), proportion, booléen bloc}
    
    # import de la liste de séquences avec leur durée par position
    print('durée')
    lsDuree = []
    with open('sqc-'+niv+an+'duree', 'r') as fichier :
        for line in fichier :
            line = line.split(';')
            lsDuree.append([line[0], line[0].split('/'), line[1].split('/')])
    print(lsDuree[0:4])
    
    # FORMAT : 
    # lsDuree = [[séquence (sep = '/'), [code 1, code 2, ...],
    #  [durée 1, durée 2, ...]]]

    # formatage de la durée de séjour
    for i in range(0, len(lsDuree)) :
        for j in range(0, len(lsDuree[i][2])) :
            duree = lsDuree[i][2][j].split('j')
            lsDuree[i][2][j] = datetime.timedelta(days = int(duree[0]), 
             minutes = int(duree[1]))

    # ajout des durées dans la base de motifs
    # calcul du nombre total d'occurences des motifs (éventuellement plusieurs par séjour)
    print('occurences')
    for i in range(0, len(lsDuree)) :
        for k in objSqc.keys() :
            if k in lsDuree[i][0] : # si apparition du motif dans la séquence
                parcours = lsDuree[i][0] # image de la séquence pour manipulations
                position = 0 # indice du premier élément retrouvé
                l = len(objSqc[k]['liste']) # longueur du motif (nombre d'éléments)
                while k in parcours :
                    position2 = int(parcours.find(k) / 5) # position dans l'image du motif
                    objSqc[k]['occ'] += 1 
                    position += position2 # saut de l'indice à la fin du motif pour recommencer la recherche dans le reste de la séquence
                    if  objSqc[k]['bloc'] :
                        for j in range(0, l) :
                            objSqc[k]['liste'][j][1] += lsDuree[i][2][position+j] # cumul des durées de séjour
                    
                    # suppression du début du séjour jusqu'à la fin du motif retrouvé 
                    #  pour chercher une nouvelle apparition de ce motif
                    if l == 1 :
                        parcours = parcours[(position2+l)*5:]
                        position += l
                    else :
                        parcours = parcours[(position2+l-1)*5:]
                        position += l - 1 
        
    print('objSqc', len(objSqc))

    # calcul de la confidence (basée sur l'occurence)
    # marquage pour suppression des motifs sans bloc
    suppr = []
    units = []
    print('confidence et tri')
    for k in objSqc.keys() :
        if  objSqc[k]['bloc'] and len(objSqc[k]['liste']) > 1:
            objSqc[k]['conf-ps'] = str(round(objSqc[k]['occ'] / objSqc[k[:4]]['occ'] * 100, 1)) + '%'
            objSqc[k]['conf-sp'] = str(round(objSqc[k]['occ'] / objSqc[k[5:]]['occ'] * 100, 1)) + '%'
            print(objSqc[k[:-5]])
            objSqc[k]['conf-sd'] = str(round(objSqc[k]['occ'] / objSqc[k[:-5]]['occ'] * 100, 1)) + '%'
            objSqc[k]['conf-ds'] = str(round(objSqc[k]['occ'] / objSqc[k[-4:]]['occ'] * 100, 1)) + '%'
            
        elif len(objSqc[k]['liste']) > 1 :
            suppr.append(k)
        elif objSqc[k]['sqc'] != '8888' and objSqc[k]['sqc'] != '9999' :
            units.append(copy.deepcopy(objSqc[k])) # base pour calcul du temps cumulé total dans chaque unité

    # suppression des motifs sans bloc
    for k in suppr :
        del objSqc[k]
    
    print('tri :', len(objSqc))

    # calcul de la dms par position dans chaque motif et reformatage
    # ajout du libellé et de l'indice de couleur
    print('libellé')
    for k in objSqc.keys() :
        l1 = len(objSqc[k]['liste'])
        
        if objSqc[k]['liste'][0][0] == '8888' : # premier item = 8888 = entrée, pas de durée
            l0 = 1
            objSqc[k]['liste'][0][0] = 'Entrée'
            del objSqc[k]['liste'][0][1]
        else :
            l0 = 0
        
        if objSqc[k]['liste'][-1][0] == '9999' : # dernier item = 9999 = sortie, pas de durée
            l1 -= 1
            objSqc[k]['liste'][-1][0] = 'Sortie'
            del objSqc[k]['liste'][-1][1]
        
        for i in range(l0, l1) :
            dms = objSqc[k]['liste'][i][1]/objSqc[k]['occ']
            heure = round(dms.seconds / 3600)
            jour = dms.days
            if heure == 24 :
                jour += 1
                heure = 0
            dms = str(jour) + 'j ' + str(heure) + 'h'
            if objSqc[k]['liste'][i][0] == 'Bloc CTCV' : 
                objSqc[k]['liste'][i][1] = dms
            else :
                objSqc[k]['liste'][i][1] = dms
                objSqc[k]['liste'][i].append(label[niv][an][objSqc[k]['liste'][i][0]]['lib'])
                objSqc[k]['liste'][i].append(label[niv][an][objSqc[k]['liste'][i][0]]['col'])
    
    # FORMAT : 
    # objSqc = {séquence : {'liste' : [[code, durée moyenne de séjour, libellé,
    #  indice couleur]], séquence (sep = '/'), support (= effectif en séjours),
    #  occurences (= nombre d'apparitions, nul), proportion, booléen bloc,
    #  fréquence d'association *4}
    
    with open('motifs-'+niv+an+'.json', 'w') as fichier : 
        fichier.write(json.dumps(objSqc, indent = 3))
    
    print(niv, an, len(objSqc))

for i in range(0, len(annee)) :
    for j in range(0, len(niveaux)) :
        analyse(annee[i], niveaux[j])


print("temps d'exécution :", time.process_time())
