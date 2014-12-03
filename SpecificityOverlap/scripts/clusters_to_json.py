#!/usr/bin/python
# Jaclyn Smith
# 11.30.14
# Grab cluster statistics and counts
# and construct a json object
# takes a gibbs cluster input file
# and raw data peptide counts

import sys, os

# hamming distance between two sequences
# 0 - no change, 1 - change
# assume equal sequence length 
def getDistance(seq1, seq2):
	dist = 0
	seq_len = len(seq1)
	for i in range(seq_len):
		if seq1[i] != seq2[i]:
			dist += 1
	return dist

def establishMatrix():
	global transition_matrix
	transition_matrix = {}
	aminos = []
	for line in trans_matrix:
		line = line.strip('\n')
		if '#' not in line:
			if ' ' == line[0]:
				aminos = line.split()
			else:
				freq = line.split()
				for i in range(1,len(freq)):
					entry = (freq[0], aminos[i-1])
					entry_op = (aminos[i-1], freq[0])
					if entry not in transition_matrix:
						if entry_op not in transition_matrix:
							transition_matrix[entry] = int(freq[i])+4

def getTransDistance(seq1, seq2):
	dist = 0
	seq_len = len(seq1)
	for i in range(seq_len):
		entry = (seq1[i], seq2[i])
		entry_2 = (seq2[i], seq1[i])
		if entry not in transition_matrix:
			dist += int(transition_matrix[entry_2])
		else:
			dist += int(transition_matrix[entry])
	return dist

def getFreqs(seqCounts):
	# get the abundance of each peptide in the system
	peptide_counts = {}
	for line in seqCounts:
		line = line.strip('\n')
		data = line.split()
		if data[1] not in peptide_counts:
			peptide_counts[data[1]] = int(data[0])
		else:
			print("Duplicate Peptide Error" + data[1])
	return peptide_counts

def getClusters(clusters, counts, this_id):
	# get the cluster size based on peptide frequency
	frequencies = getFreqs(counts)

	all_clusters = {}
	cluster_freqs = {}
	cluster = {}
	cluster_num = 1
	total_abundance = 0
	for line in clusters:
		line = line.strip('\n')
		seqs = line.split('\t')
		if len(seqs) > 1:
			seq_info = seqs[0].split()
			if seq_info[1] not in cluster:
				cluster[seq_info[1]] = frequencies.get(seq_info[1], 1)
			else:
				print("Duplicate Peptide Error" + seq_info[1])
			total_abundance += frequencies.get(seq_info[1], 1)
		elif '*' in seqs[0] and len(cluster) > 0:
			all_clusters[this_id+"_cluster_"+str(cluster_num)] = cluster
			cluster_freqs[this_id+"_cluster_"+str(cluster_num)] = int(total_abundance*len(cluster))
			cluster = {}
			total_abundance = 0
			cluster_num += 1

	# compute pairwise distances between peptides to establish sequence distance
	pw_distances = {}
	pairwise_dists = ''
	pairwise_dists_object = {}
	main_cluster = 1
	while main_cluster < cluster_num:
		cluster_one = this_id + "_cluster_" + str(main_cluster)
		comp_cluster = main_cluster + 1
		while comp_cluster < cluster_num:
			cluster_two = this_id + "_cluster_" + str(comp_cluster)
			distances = []
			for peptide in all_clusters[cluster_one]:
				for peptide_two in all_clusters[cluster_two]:
					distances.append(getDistance(peptide, peptide_two))
			
			# median counts
			# 23 6
    		# 572 7

			distances.sort()
			if len(distances) % 2 == 0:
				l = len(distances)/2
				r = l + 1
				median = float(distances[l] + distances[r])/2
				#print int(median)
			else:
				median = distances[len(distances)/2]
				#print median
			# average counts
			# 1 5
    	    # 593 6
     		# 1 7
			#print sum(distances)/len(distances)
			pw_distances[cluster_one+"-"+cluster_two] = median
			if comp_cluster == cluster_num-1 and comp_cluster == main_cluster+1:
				pairwise_dists += "{ source: '" + cluster_one + "', target: '" + cluster_two + "', distance: " + str(median) + ", sSize: " + str(cluster_freqs[cluster_one]) + ", tSize: " + str(cluster_freqs[cluster_two]) + " }"
				#pairwise_dists_object = { source: cluster_one, target: cluster_two, distance: str(median), sSize: str(cluster_freqs[cluster_one]), tSize: str(cluster_freqs[cluster_two]) }
			else:
				pairwise_dists += "{ source: '" + cluster_one + "', target: '" + cluster_two + "', distance: " + str(median) + ", sSize: " + str(cluster_freqs[cluster_one]) + ", tSize: " + str(cluster_freqs[cluster_two]) + " }, "
				#pairwise_dists_object = { source: cluster_one, target: cluster_two, distance: str(median), sSize: str(cluster_freqs[cluster_one]), tSize: str(cluster_freqs[cluster_two]) }
			pairwise_dists_object[cluster_one+"-"+cluster_two] = { 'source': cluster_one, 'target': cluster_two, 'distance': median, 'sSize': cluster_freqs[cluster_one], 'tSize': cluster_freqs[cluster_two] }
			comp_cluster += 1
		main_cluster += 1
	#print pw_distances
	#print("calling ----------------------------------")
	#print(pairwise_dists_object)
	#return all_clusters, cluster_freqs, pairwise_dists
	#return all_clusters, pairwise_dists, pairwise_dists_object
	return all_clusters, pairwise_dists_object, cluster_freqs

# find degree of overlap between clusters
def findOverlap(network_one, network_two, freq_one, freq_two):
	overlap = {}
	sig_overlap = {}
	percents = []

	#new_network = dict(network_one, **network_two)
	#print('CLUSTER_ONE' + "\t" + 'CLUSTER_TWO' + '\t' + 'PERCENT_OVERLAP' + '\t' + 'PERCENT_ONE_ONLY' + '\t' + 'PERCENT_TWO_ONLY')
	for cluster_one in network_one:
		for cluster_two in network_two:
			overlapped_group = []
			for peptide in network_one[cluster_one]:
				if peptide in network_two[cluster_two]:
					overlapped_group.append(peptide)
			combined_length = float(len(network_one[cluster_one]) + len(network_two[cluster_two]) - len(overlapped_group))
			percentage_overlap = round(float(len(overlapped_group)/combined_length),3)
			percentage_one = round(float((len(network_one[cluster_one])-len(overlapped_group))/combined_length),3)
			percentage_two = round(float((len(network_two[cluster_two])-len(overlapped_group))/combined_length),3)
			#print(cluster_one +"\t" + cluster_two +"\t" + str(percentage_overlap) + '\t' + str(percentage_one) + '\t' + str(percentage_two))
			overlap[cluster_one+"-"+cluster_two] = overlapped_group

			percents.append(percentage_overlap)
			if percentage_overlap > .095:
				sig_overlap[cluster_one+"-"+cluster_two] = { 'percent_overlap': percentage_overlap, 'percent_one': percentage_one, 'percent_two': percentage_two, 'size' : freq_one[cluster_one] + freq_two[cluster_two] }
	
	# take top ten percent of overlap scores
	#percents.sort()
	#print(percents)
	#top_10_percent = int(len(percents)*.1)
	#print(top_10_percent)
	#print(percents[len(percents)-top_10_percent-1:len(percents)-1])
	#print(sig_overlap)
	#print(overlap)

	return sig_overlap

def getOverlapNetwork(net_one, net_two, overlap):
	
	overlap_network = {}
	print("HERE ARE ALL THE UPDATES")
	old_clusters = {}
	for key in overlap:
		new = key.split("-")
		old_clusters[new[0]] = key
		old_clusters[new[1]] = key
	# for every edge
	for edge in net_one:
		# prepare new edge
		made_new = False
		new_source = net_one[edge]['source']
		new_ssize = net_one[edge]['sSize']
		new_target = net_one[edge]['target']
		new_tsize = net_one[edge]['tSize']
		new_dist = net_one[edge]['distance']
		# get the clusters from the edge
		clusters = edge.split("-")
		# for each of the clusters
		for i in clusters:
			# is the cluster destined to be removed
			if i in old_clusters:
				made_new = True
				if i == net_one[edge]['target']:
					overlap_network[new_source+"-"+old_clusters[i]] = {'source' : new_source, 'sSize': new_ssize, 'target': old_clusters[i], 'tSize': overlap[old_clusters[i]]['size'], 'distance' : new_dist, 'is_overlap': 'true', 'percent_overlap' : overlap[old_clusters[i]]['percent_overlap'], 'percent_one' : overlap[old_clusters[i]]['percent_one'], 'percent_two' : overlap[old_clusters[i]]['percent_two']}
				elif i == net_one[edge]['source']:
					overlap_network[old_clusters[i]+"-"+new_target] = {'source' : old_clusters[i], 'sSize': overlap[old_clusters[i]]['size'], 'target': new_target, 'tSize': new_tsize, 'distance' : new_dist, 'is_overlap': 'true', 'percent_overlap' : overlap[old_clusters[i]]['percent_overlap'], 'percent_one' : overlap[old_clusters[i]]['percent_one'], 'percent_two' : overlap[old_clusters[i]]['percent_two']}
		if(not made_new):
			overlap_network[edge] = {'source' : new_source, 'sSize': new_ssize, 'target': new_target, 'tSize': new_tsize, 'distance' : new_dist, 'is_overlap':'false'}	
		made_new = False

	for edge in net_two:
		# prepare new edge
		made_new = False
		new_source = net_two[edge]['source']
		new_ssize = net_two[edge]['sSize']
		new_target = net_two[edge]['target']
		new_tsize = net_two[edge]['tSize']
		new_dist = net_two[edge]['distance']
		# get the clusters from the edge
		clusters = edge.split("-")
		# for each of the clusters
		for i in clusters:
			# is the cluster destined to be removed
			if i in old_clusters:
				made_new = True
				if i == net_two[edge]['target']:
					overlap_network[new_source+"-"+old_clusters[i]] = {'source' : new_source, 'sSize': new_ssize, 'target': old_clusters[i], 'tSize': overlap[old_clusters[i]]['size'], 'distance' : new_dist, 'is_overlap' : 'true', 'percent_overlap' : overlap[old_clusters[i]]['percent_overlap'], 'percent_one' : overlap[old_clusters[i]]['percent_one'], 'percent_two' : overlap[old_clusters[i]]['percent_two']}
				elif i == net_two[edge]['source']:
					overlap_network[old_clusters[i]+"-"+new_target] = {'source' : old_clusters[i], 'sSize': overlap[old_clusters[i]]['size'], 'target': new_target, 'tSize': new_tsize, 'distance' : new_dist, 'is_overlap' : 'true', 'percent_overlap' : overlap[old_clusters[i]]['percent_overlap'], 'percent_one' : overlap[old_clusters[i]]['percent_one'], 'percent_two' : overlap[old_clusters[i]]['percent_two']}
		if(not made_new):
			overlap_network[edge] = {'source' : new_source, 'sSize': new_ssize, 'target': new_target, 'tSize': new_tsize, 'distance' : new_dist, 'is_overlap' : 'false'}	
		made_new = False

	print overlap_network
	# for key in overlap_network:
	# 	print key
	# 	print overlap_network[key]
	# 	print ''

def main(argv=None):
	if argv == None:   
		argv = sys.argv[1:]
	try:
		global trans_matrix
		trans_matrix = open('blosum62.txt', "r")
		cluster_file_one = open(argv[0], "r")
		seq_counts_one = open(argv[1], "r")
		cluster_file_two = open(argv[2], "r")
		seq_counts_two = open(argv[3], "r")
	except:
		err = "clusters_to_json.py <cluster_file_1> <seq_counts_1> <cluster_file_2> <seq_counts_2>"

	#establishMatrix()
	clusters_one, network_obj_one, freqs_one = getClusters(cluster_file_one, seq_counts_one, "PAP1")
	clusters_two, network_obj_two, freqs_two = getClusters(cluster_file_two, seq_counts_two, "PAP2")

	overlap = findOverlap(clusters_one, clusters_two, freqs_one, freqs_two)
	getOverlapNetwork(network_obj_one, network_obj_two, overlap)
	#generateJSON(cluster_file_one, seq_counts_one, "PAP1")

if __name__ == "__main__":
	sys.exit(main())