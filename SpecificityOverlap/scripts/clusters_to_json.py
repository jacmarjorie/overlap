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
				print(aminos)
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

def generateJSON(clusterFile, seqCounts):

	# get the abundance of each peptide in the system
	peptide_freqs = {}
	for line in seqCounts:
		line = line.strip('\n')
		data = line.split()
		if data[1] not in peptide_freqs:
			peptide_freqs[data[1]] = int(data[0])
		else:
			print("Duplicate Peptide Error" + data[1])

	# get the cluster size based on peptide frequency
	all_clusters = {}
	cluster_freqs = {}
	cluster = []
	cluster_num = 1
	total_abundance = 0
	for line in clusterFile:
		line = line.strip('\n')
		seqs = line.split('\t')
		if len(seqs) > 1:
			seq_info = seqs[0].split()
			cluster.append(seq_info[1])
			total_abundance += peptide_freqs.get(seq_info[1], 1)
		elif '*' in seqs[0] and len(cluster) > 0:
			all_clusters["cluster_"+str(cluster_num)] = cluster
			cluster_freqs["cluster_"+str(cluster_num)] = int(total_abundance*len(cluster))
			cluster = []
			total_abundance = 0
			cluster_num += 1

	# compute pairwise distances between sequences
	pairwise_dists = ''
	main_cluster = 1
	while main_cluster < cluster_num:
		cluster_one = "cluster_"+str(main_cluster)
		comp_cluster = main_cluster + 1
		while comp_cluster < cluster_num:
			cluster_two = "cluster_" + str(comp_cluster)
			distances = []
			for peptide in all_clusters[cluster_one]:
				for peptide_two in all_clusters[cluster_two]:
					distances.append(getTransDistance(peptide, peptide_two))
			
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
			if comp_cluster == cluster_num-1 and comp_cluster == main_cluster+1:
				pairwise_dists += "{ source: '" + cluster_one + "', target: '" + cluster_two + "', distance: " + str(median) + ", sSize: " + str(cluster_freqs[cluster_one]) + ", tSize: " + str(cluster_freqs[cluster_two]) + " }"
			else:
				pairwise_dists += "{ source: '" + cluster_one + "', target: '" + cluster_two + "', distance: " + str(median) + ", sSize: " + str(cluster_freqs[cluster_one]) + ", tSize: " + str(cluster_freqs[cluster_two]) + " }, "
			comp_cluster += 1
		main_cluster += 1
	print(pairwise_dists)

def main(argv=None):
	if argv == None:   
		argv = sys.argv[1:]
	try:
		global trans_matrix
		trans_matrix = open('blosum62.txt', "r")
		cluster_file = open(argv[0], "r")
		seq_counts = open(argv[1], "r")
	except:
		err = "clusters_to_json.py <cluster_file> <seq_counts>"

	establishMatrix()
	generateJSON(cluster_file, seq_counts)

if __name__ == "__main__":
	sys.exit(main())