
# Article notes


## Structure

Start with a general introduction on the transformer and what came before (RNNs, Bahdanau Attention, ...).
Try to paint a picture of how the basic idea of only using attention came to be:

1. What was the previous state of the art?
2. What problem does removing recurrence solve?
3. What hardware improvements made transformers a viable candidate architecture? (Hint: GPUs)


### 1. Previous state of the art

Prior to the AiAYN paper, there was a number of publicashions that would inspire and ultimately lead to the 
transformer architecture.

1. 2014 — Sequence to Sequence Learning with Neural Networks (Sutskever, Vinyals & Le): established the encoder–decoder framework using LSTMs.
2. 2014 — Neural Machine Translation by Jointly Learning to Align and Translate (Bahdanau, Cho & Bengio): introduced learned attention over encoder states.
3. 2015 — Effective Approaches to Attention-based Neural Machine Translation (Luong, Pham & Manning): developed widely used attention variants.
4. 2017 -- ConvS2S: convolutional network was a serious competitor due to greater parallelism in training.
