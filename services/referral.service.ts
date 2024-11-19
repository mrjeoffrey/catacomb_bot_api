import { User } from '../models/user.model';
import { Referral } from '../models/referral.model';

export async function handleReferral(userId: string, referredBy: string): Promise<void> {
    const referringUser = await User.findById(referredBy);

    if (referringUser && referringUser.gold > 0) {
        const referralBonus = referringUser.gold * 0.1;
        referringUser.gold += referralBonus;
        referringUser.save();
    }

    const referral = new Referral({ userId, referredBy });
    referral.save();
}
